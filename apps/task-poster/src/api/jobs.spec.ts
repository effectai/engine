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
