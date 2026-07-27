import { describe, expect, it } from "vitest";
import { type Job, computeJobCredits } from "./jobs.js";

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

  // The cancel endpoint refunds `remaining - inFlight` upfront, then each
  // in-flight task settles via processResults: a confirmed cancellation adds
  // its reward to refundedLamports, a late submission raises the completed
  // count. Every reserved lamport must end up consumed or refunded.
  it("drain settlement: cancel with in-flight tasks balances to zero", () => {
    const reward = 500_000n;
    const job = baseJob();

    // at cancel time: 4 completed, 3 in flight, 3 still queued
    let completed = 4;
    const inFlight = 3n * reward;
    const atCancel = computeJobCredits(job, completed);
    const refundNow = atCancel.remaining - inFlight;
    expect(refundNow).toBe(1_500_000n); // the 3 queued tasks

    job.refundedLamports = refundNow.toString();
    expect(computeJobCredits(job, completed).remaining).toBe(inFlight);

    // one in-flight task is cancelled by the manager → per-task refund
    job.refundedLamports = (BigInt(job.refundedLamports) + reward).toString();
    // one is completed by a worker before the cancel lands
    completed += 1;
    // the last one is cancelled too
    job.refundedLamports = (BigInt(job.refundedLamports) + reward).toString();

    const settled = computeJobCredits(job, completed);
    expect(settled.remaining).toBe(0n);
    expect(settled.consumed + settled.refunded).toBe(settled.reserved);
  });
});
