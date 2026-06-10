import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  InsufficientCreditsError,
  credit,
  debit,
  getBalance,
  listLedgerEntries,
  refund,
} from "./ledger.js";
import { db } from "../state.js";

const dir = mkdtempSync(join(tmpdir(), "ledger-test-"));

beforeAll(async () => {
  await db.open(join(dir, "test.db"));
});

afterAll(async () => {
  await db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("credit ledger", () => {
  const account = "acct_test_1";

  it("starts at zero", async () => {
    expect(await getBalance(account)).toBe(0n);
  });

  it("credits, debits and refunds", async () => {
    await credit(account, 1_000_000n, { note: "top-up" });
    expect(await getBalance(account)).toBe(1_000_000n);

    await debit(account, 400_000n, { jobId: "job1" });
    expect(await getBalance(account)).toBe(600_000n);

    await refund(account, 100_000n, { jobId: "job1" });
    expect(await getBalance(account)).toBe(700_000n);

    const entries = await listLedgerEntries(account);
    expect(entries.map((entry) => entry.type)).toEqual([
      "refund",
      "debit",
      "topup",
    ]); // newest first
    expect(entries[0]?.balanceAfter).toBe("700000");
  });

  it("rejects overdraw and leaves the balance intact", async () => {
    await expect(debit(account, 10_000_000n)).rejects.toBeInstanceOf(
      InsufficientCreditsError,
    );
    expect(await getBalance(account)).toBe(700_000n);
  });

  it("serializes concurrent debits without going negative", async () => {
    const acct = "acct_test_2";
    await credit(acct, 1_000n);

    // 20 concurrent debits of 100 against a 1000 balance → exactly 10 succeed
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () => debit(acct, 100n)),
    );
    const succeeded = results.filter((r) => r.status === "fulfilled").length;

    expect(succeeded).toBe(10);
    expect(await getBalance(acct)).toBe(0n);
  });
});
