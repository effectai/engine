import { ulid } from "ulid";
import { db } from "../state.js";

/**
 * Off-chain credit ledger, denominated in EFFECT lamports (1 EFFECT = 1e6).
 *
 * Atomicity: `@cross/kv`'s `beginTransaction` is a *global* lock that would
 * collide with the auto-import loop's per-task transactions, so we serialize
 * the ledger's read-modify-write with a single in-process async mutex instead.
 * The task-poster is a single Node process, so this makes balance updates
 * fully race-free. Within the lock we write the audit entry first and the
 * balance last, so a crash mid-write can never silently reduce a balance.
 */

export type LedgerEntryType = "topup" | "debit" | "refund";

export type LedgerEntry = {
  id: string;
  accountId: string;
  type: LedgerEntryType;
  amount: string; // lamports, always positive
  balanceAfter: string; // lamports
  jobId?: string;
  note?: string;
  timestamp: number;
};

type LedgerRecord = {
  accountId: string;
  balance: string; // lamports
  updatedAt: number;
};

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly required: bigint,
    public readonly available: bigint,
  ) {
    super(`Insufficient credits: need ${required} lamports, have ${available}.`);
    this.name = "InsufficientCreditsError";
  }
}

// in-process mutex (promise chain) serializing every ledger mutation
let chain: Promise<unknown> = Promise.resolve();
const withLock = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

export const getBalance = async (accountId: string): Promise<bigint> => {
  const record = await db.get<LedgerRecord>(["ledger", accountId]);
  return record ? BigInt(record.data.balance) : 0n;
};

export const listLedgerEntries = async (
  accountId: string,
  limit = 50,
  offset = 0,
): Promise<LedgerEntry[]> => {
  // KV `listAll` has no offset, so over-fetch the first `offset + limit`
  // newest-first entries and drop the offset prefix (same pattern as
  // `/jobs/:id/results`). Fine for the modest page sizes the API allows.
  const records = await db.listAll<LedgerEntry>(
    ["ledger-entry", accountId, {}],
    offset + limit,
    true,
  );
  return records.slice(offset).map((record) => record.data);
};

/** Total number of ledger entries for an account (for pagination metadata). */
export const countLedgerEntries = (accountId: string): number =>
  db.count(["ledger-entry", accountId, {}]);

// applies a signed change under the lock; throws if it would go negative
const apply = (
  accountId: string,
  type: LedgerEntryType,
  amount: bigint,
  opts: { jobId?: string; note?: string } = {},
): Promise<bigint> =>
  withLock(async () => {
    if (amount < 0n) throw new Error("Ledger amount must be positive");

    const current = await getBalance(accountId);
    const next = current + (type === "debit" ? -amount : amount);
    if (next < 0n) throw new InsufficientCreditsError(amount, current);

    const entry: LedgerEntry = {
      id: ulid(),
      accountId,
      type,
      amount: amount.toString(),
      balanceAfter: next.toString(),
      jobId: opts.jobId,
      note: opts.note,
      timestamp: Date.now(),
    };
    // entry first, balance last (see atomicity note above)
    await db.set<LedgerEntry>(["ledger-entry", accountId, entry.id], entry);
    await db.set<LedgerRecord>(["ledger", accountId], {
      accountId,
      balance: next.toString(),
      updatedAt: entry.timestamp,
    });
    return next;
  });

/** Adds credits (manual top-up by the team). */
export const credit = (
  accountId: string,
  amount: bigint,
  opts?: { jobId?: string; note?: string },
): Promise<bigint> => apply(accountId, "topup", amount, opts);

/** Spends credits; rejects with `InsufficientCreditsError` if balance < amount. */
export const debit = (
  accountId: string,
  amount: bigint,
  opts?: { jobId?: string; note?: string },
): Promise<bigint> => apply(accountId, "debit", amount, opts);

/** Returns credits (e.g. for tasks that never got a submission). */
export const refund = (
  accountId: string,
  amount: bigint,
  opts?: { jobId?: string; note?: string },
): Promise<bigint> => apply(accountId, "refund", amount, opts);
