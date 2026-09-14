import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  type Job,
  cancelJob,
  computeJobCredits,
  writeJob,
} from "./jobs.js";
import { credit, debit, getBalance, listLedgerEntries } from "./ledger.js";
import { getDataset, writeDataset } from "../dataset.js";
import {
  cancelTasks,
  countTasks,
  createFetcher,
  getFetcher,
  importCsvIntoFetcher,
} from "../fetcher.js";
import { db } from "../state.js";

// Only the manager call is stubbed; everything else runs against a real KV.
vi.mock("../fetcher.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../fetcher.js")>()),
  cancelTasks: vi.fn(),
}));

const dir = mkdtempSync(join(tmpdir(), "jobs-test-"));

beforeAll(async () => {
  await db.open(join(dir, "test.db"));
});

afterAll(async () => {
  await db.close();
  rmSync(dir, { recursive: true, force: true });
});

const baseJob = (overrides: Partial<Job> = {}): Job => ({
  id: "j1",
  accountId: "a1",
  datasetId: 1,
  fetcherIndex: 1,
  type: "csv",
  name: "n",
  templateId: "t",
  rewardLamports: "500000", // 0.5 EFFECT
  taskCount: 10,
  reservedLamports: "5000000", // 5 EFFECT = 10 × 0.5
  consumedLamports: "0",
  refundedLamports: "0",
  status: "active",
  uniqueWorker: false,
  batchId: null,
  batchIndex: 0,
  batchSize: 1,
  createdAt: 0,
  ...overrides,
});

describe("computeJobCredits (reconciliation)", () => {
  it("nothing completed → full reserved remains", () => {
    const credits = computeJobCredits(baseJob(), 0);
    expect(credits.consumed).toBe(0n);
    expect(credits.remaining).toBe(5_000_000n);
  });

  it("partial completion consumes proportionally", () => {
    const credits = computeJobCredits(baseJob(), 4);
    expect(credits.consumed).toBe(2_000_000n); // 4 × 0.5
    expect(credits.remaining).toBe(3_000_000n);
  });

  it("all completed → nothing remaining to refund", () => {
    const credits = computeJobCredits(baseJob(), 10);
    expect(credits.consumed).toBe(5_000_000n);
    expect(credits.remaining).toBe(0n);
  });

  it("accounts for prior refunds and never goes negative", () => {
    const credits = computeJobCredits(
      baseJob({ refundedLamports: "3000000" }),
      6,
    );
    expect(credits.consumed).toBe(3_000_000n);
    expect(credits.refunded).toBe(3_000_000n);
    expect(credits.remaining).toBe(0n); // 5 - 3 - 3 = -1 → clamped
  });
});

// --------------------------------------------------------------- cancelJob

const REWARD = 500_000n; // 0.5 EFFECT per task
let nextDatasetId = 1000;

// Mirrors performJobCreation: credits debited, hidden dataset, csv fetcher with
// every task sitting in the queue.
const createJob = async (taskCount: number): Promise<Job> => {
  const datasetId = nextDatasetId++;
  const accountId = `acct_${datasetId}`;
  const jobId = `job_${datasetId}`;
  const cost = REWARD * BigInt(taskCount);

  await credit(accountId, cost);
  await debit(accountId, cost, { jobId });

  const dataset = {
    id: datasetId,
    name: "job",
    status: "active" as const,
    hidden: true,
    ownerId: accountId,
  };
  await writeDataset(datasetId, dataset);
  const fetcher = await createFetcher(dataset, {
    name: "job",
    type: "csv",
    capabilities: "",
    engine: "effectai",
    price: REWARD.toString(),
    template: "tpl",
    timeLimitSeconds: 600,
    frequency: 2,
    batchSize: 100,
    hidden: false,
    repetitions: 0,
  });
  const rows = Array.from({ length: taskCount }, (_, row) => `row${row}`);
  await importCsvIntoFetcher(fetcher, ["x", ...rows].join("\n"));

  const job = baseJob({
    id: jobId,
    accountId,
    datasetId,
    fetcherIndex: fetcher.index,
    rewardLamports: REWARD.toString(),
    taskCount,
    reservedLamports: cost.toString(),
  });
  await writeJob(job);
  await db.set(["job-by-dataset", datasetId], { accountId, jobId });
  return job;
};

const bucketKey = (job: Job, bucket: string) => [
  "fetcher",
  job.datasetId,
  job.fetcherIndex,
  bucket,
];

// Moves the first `count` queued tasks into `bucket`, the way importTasks
// (active), processResults (done) or a failed post (failed) would.
const moveFromQueue = async (
  job: Job,
  bucket: string,
  count: number,
): Promise<string[]> => {
  const entries = await db.listAll<boolean>(
    [...bucketKey(job, "queue"), {}],
    count,
  );
  for (const entry of entries) {
    await db.delete(entry.key);
    await db.set<boolean>([...bucketKey(job, bucket), entry.key[4]], true);
  }
  return entries.map((entry) => entry.key[4] as string);
};

const counts = async (job: Job) => {
  const fetcher = (await getFetcher(job.datasetId, job.fetcherIndex))!;
  return {
    queued: countTasks(fetcher, "queue"),
    active: countTasks(fetcher, "active"),
    completed: countTasks(fetcher, "done"),
    cancelled: countTasks(fetcher, "cancelled"),
    failed: countTasks(fetcher, "failed"),
  };
};

const refundEntries = async (accountId: string) =>
  (await listLedgerEntries(accountId)).filter(
    (entry) => entry.type === "refund",
  );

describe("cancelJob", () => {
  beforeEach(() => {
    vi.mocked(cancelTasks).mockReset();
  });

  it("retires and refunds every queued task without asking the manager", async () => {
    const job = await createJob(4);

    const { job: cancelled, withdrawalFailed } = await cancelJob(job);

    expect(cancelled.status).toBe("cancelled");
    expect(withdrawalFailed).toBe(false);
    expect(await counts(job)).toEqual({
      queued: 0,
      active: 0,
      completed: 0,
      cancelled: 4,
      failed: 0,
    });
    expect(BigInt(cancelled.refundedLamports)).toBe(REWARD * 4n);
    expect(await getBalance(job.accountId)).toBe(REWARD * 4n);
    expect(cancelTasks).not.toHaveBeenCalled();

    // nothing was ever posted, so there is no result to wait for: both the
    // fetcher and the dataset are archived and the loop stops visiting them
    expect((await getFetcher(job.datasetId, job.fetcherIndex))?.status).toBe(
      "archived",
    );
    expect((await getDataset(job.datasetId))?.data.status).toBe("archived");
  });

  it("withdraws posted tasks through the manager and leaves submitted ones to the result loop", async () => {
    const job = await createJob(8);
    await moveFromQueue(job, "done", 2);
    await moveFromQueue(job, "failed", 1); // could not be posted
    const [withdrawn, submitted] = await moveFromQueue(job, "active", 2);
    vi.mocked(cancelTasks).mockResolvedValue([
      { taskId: withdrawn, status: "cancelled" },
      { taskId: submitted, status: "submitted" },
    ]);

    const { job: cancelled } = await cancelJob(job);

    expect(cancelTasks).toHaveBeenCalledTimes(1);
    expect(vi.mocked(cancelTasks).mock.calls[0][0].sort()).toEqual(
      [withdrawn, submitted].sort(),
    );
    expect(await counts(job)).toEqual({
      queued: 0,
      active: 1, // the worker wins; collected later as consumed
      completed: 2,
      cancelled: 4, // 3 queued + 1 withdrawn
      failed: 1,
    });
    // refund = 3 queued + 1 withdrawn + 1 failed, all at the task reward
    expect(BigInt(cancelled.refundedLamports)).toBe(REWARD * 5n);
    expect(await getBalance(job.accountId)).toBe(REWARD * 5n);
    expect(await refundEntries(job.accountId)).toHaveLength(1);
    // exactly one task's worth is still reserved: the one still out
    expect(computeJobCredits(cancelled, 2).remaining).toBe(REWARD);
    // a task is still with a worker, so the loop must keep visiting
    expect((await getDataset(job.datasetId))?.data.status).toBe("active");
  });

  it("is idempotent and repairs a failed manager call on the next attempt", async () => {
    const job = await createJob(3);
    const [posted] = await moveFromQueue(job, "active", 1);

    vi.mocked(cancelTasks).mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const { job: first, withdrawalFailed } = await cancelJob(job);
    expect(first.status).toBe("cancelled");
    expect(BigInt(first.refundedLamports)).toBe(REWARD * 2n); // queue only
    expect(await counts(job)).toMatchObject({ active: 1, cancelled: 2 });
    // the requestor is told to call again, so the task must stay reachable
    expect(withdrawalFailed).toBe(true);
    expect((await getDataset(job.datasetId))?.data.status).toBe("active");

    // the manager is back and no longer knows the task: it can never
    // produce a result, so it is refunded now
    vi.mocked(cancelTasks).mockResolvedValueOnce([
      { taskId: posted, status: "not_found" },
    ]);
    const { job: second, withdrawalFailed: failedAgain } =
      await cancelJob(first);
    expect(failedAgain).toBe(false);
    expect(BigInt(second.refundedLamports)).toBe(REWARD * 3n);
    expect(await counts(job)).toMatchObject({ active: 0, cancelled: 3 });
    expect(await getBalance(job.accountId)).toBe(REWARD * 3n);
    expect((await getDataset(job.datasetId))?.data.status).toBe("archived");

    // nothing left to do: no ledger entry, no change
    const { job: third } = await cancelJob(second);
    expect(third.refundedLamports).toBe(second.refundedLamports);
    expect(cancelTasks).toHaveBeenCalledTimes(2); // no active ids left
    expect(await refundEntries(job.accountId)).toHaveLength(2);
  });
});
