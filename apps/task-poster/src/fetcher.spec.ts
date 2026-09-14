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
  type Fetcher,
  cancelTasks,
  countTasks,
  getTasks,
  processFetcher,
} from "./fetcher.js";
import { db } from "./state.js";
import type { TemplateRecord } from "./templates.js";

// The manager HTTP client is the module-level axios instance in fetcher.ts.
const managerApi = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("axios", () => ({ default: { create: () => managerApi } }));

// The only API-layer call the loop makes; its accounting is tested in
// api/jobs.spec.ts.
vi.mock("./api/jobs.js", () => ({ reconcileCancelledJob: vi.fn() }));
import { reconcileCancelledJob } from "./api/jobs.js";

const dir = mkdtempSync(join(tmpdir(), "fetcher-test-"));

beforeAll(async () => {
  await db.open(join(dir, "t.db"));
});
afterAll(async () => {
  await db.close();
  rmSync(dir, { recursive: true, force: true });
});

beforeEach(() => {
  managerApi.get.mockReset();
  managerApi.post.mockReset();
  vi.mocked(reconcileCancelledJob).mockReset();
});

const putTemplate = (id: string, extra: Partial<TemplateRecord>) =>
  db.set<TemplateRecord>(["templates", id], {
    templateId: id,
    name: id,
    data: "<p>${x}</p>",
    status: "active",
    createdAt: 0,
    ...extra,
  });

const csvFetcher = (templateId: string): Fetcher => ({
  lastImport: undefined,
  datasetId: 1,
  index: 1,
  type: "csv",
  capabilities: [""],
  engine: "effectai",
  name: "t",
  price: 1000,
  frequency: 1,
  batchSize: 10,
  template: templateId,
  timeLimitSeconds: 600,
  taskIdx: 0,
  totalTasks: 0,
  status: "active",
});

const approvedFlagOf = (templateDataJson: string): unknown =>
  JSON.parse(templateDataJson).__effectApproved;

describe("getTasks injects the template trust flag", () => {
  it("approved (team/public) template → __effectApproved: true", async () => {
    await putTemplate("tpl-approved", {}); // no ownerId = team = approved
    const tasks = await getTasks(csvFetcher("tpl-approved"), "x\n1\n2");
    expect(tasks).toHaveLength(2);
    expect(approvedFlagOf(tasks[0].templateData)).toBe(true);
    expect(JSON.parse(tasks[0].templateData).x).toBe("1"); // row data preserved
  });

  it("unapproved custom template → __effectApproved: false", async () => {
    await putTemplate("tpl-unapproved", { ownerId: "acct1", approved: false });
    const tasks = await getTasks(csvFetcher("tpl-unapproved"), "x\n1");
    expect(approvedFlagOf(tasks[0].templateData)).toBe(false);
  });

  it("missing template → defaults to safe (true)", async () => {
    const tasks = await getTasks(csvFetcher("does-not-exist"), "x\n1");
    expect(approvedFlagOf(tasks[0].templateData)).toBe(true);
  });
});

describe("processFetcher on an archived fetcher", () => {
  it("still collects results for posted tasks but posts nothing new", async () => {
    const fetcher: Fetcher = {
      ...csvFetcher("tpl-approved"),
      datasetId: 2,
      status: "archived",
    };
    await db.set<Fetcher>(["fetcher", 2, 1, "info"], fetcher);
    await db.set<boolean>(["fetcher", 2, 1, "active", "posted"], true);
    await db.set<boolean>(["fetcher", 2, 1, "queue", "waiting"], true);
    managerApi.get.mockResolvedValueOnce({
      data: [
        {
          type: "submission",
          taskId: "posted",
          result: "{}",
          timestamp: 1,
          submissionByPeer: "peer",
        },
      ],
    });

    expect(await processFetcher(fetcher)).toBe(0);

    expect(managerApi.get).toHaveBeenCalledWith("/task-results", {
      params: { ids: "posted" },
    });
    expect(managerApi.post).not.toHaveBeenCalled(); // nothing posted
    expect(countTasks(fetcher, "done")).toBe(1);
    expect(countTasks(fetcher, "active")).toBe(0);
    expect(countTasks(fetcher, "queue")).toBe(1); // still waiting, never posted
    // a submission also settles a cancelled job: it may have been the last
    // task anyone was holding
    expect(reconcileCancelledJob).toHaveBeenCalledWith(2);
  });

  it("moves tasks the manager retired into cancelled and settles the job", async () => {
    const fetcher: Fetcher = {
      ...csvFetcher("tpl-approved"),
      datasetId: 3,
      status: "archived",
    };
    await db.set<Fetcher>(["fetcher", 3, 1, "info"], fetcher);
    await db.set<boolean>(["fetcher", 3, 1, "active", "letGo"], true);
    await db.set<boolean>(["fetcher", 3, 1, "active", "stillHeld"], true);
    managerApi.get.mockResolvedValueOnce({
      data: [
        { type: "cancel", taskId: "letGo", timestamp: 2 },
        { taskId: "stillHeld", error: "NOT FOUND" },
      ],
    });

    await processFetcher(fetcher);

    expect(countTasks(fetcher, "cancelled")).toBe(1);
    expect(countTasks(fetcher, "active")).toBe(1);
    expect(countTasks(fetcher, "done")).toBe(0);
    expect(reconcileCancelledJob).toHaveBeenCalledWith(3);
  });
});

describe("cancelTasks", () => {
  it("sends ids in chunks and concatenates the manager's outcomes in order", async () => {
    managerApi.post.mockImplementation(
      async (_route: string, body: { ids: string[] }) => ({
        data: body.ids.map((id) => ({ taskId: id, status: "cancelled" })),
      }),
    );
    const ids = Array.from({ length: 2500 }, (_, index) => `id${index}`);

    const outcomes = await cancelTasks(ids);

    expect(managerApi.post).toHaveBeenCalledTimes(3);
    expect(managerApi.post.mock.calls[0][1].ids).toHaveLength(1000);
    expect(managerApi.post.mock.calls[2][1].ids).toHaveLength(500);
    expect(outcomes).toHaveLength(2500);
    expect(outcomes[2499]).toEqual({ taskId: "id2499", status: "cancelled" });
  });
});
