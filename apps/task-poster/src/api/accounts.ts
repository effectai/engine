import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ulid } from "ulid";
import { apiError } from "./api-util.js";
import { db } from "../state.js";

/**
 * Requestor accounts + API keys for the external API.
 *
 * Identity is off-chain for v1: an account is just a record, and access is
 * granted by API keys. Only the sha256 *hash* of a key is ever stored; the
 * raw key is shown once at issuance.
 */

export type AccountStatus = "active" | "suspended";

export type Account = {
  id: string;
  name: string;
  email?: string;
  status: AccountStatus;
  createdAt: number;
};

export type ApiKeyStatus = "active" | "revoked";

export type ApiKeyRecord = {
  hash: string; // sha256 of the raw key (also the KV key tail)
  accountId: string;
  prefix: string; // display-only, e.g. "eff_live_ab12cd…"
  status: ApiKeyStatus;
  createdAt: number;
};

const KEY_PREFIX = "eff_live_";

export const hashApiKey = (rawKey: string): string =>
  createHash("sha256").update(rawKey).digest("hex");

// Opaque random key. base64url keeps it header/URL-safe and dependency-free
// (bs58 isn't a task-poster dependency); the prefix makes leaked keys greppable.
const generateRawKey = (): string =>
  KEY_PREFIX + randomBytes(32).toString("base64url");

const displayPrefix = (rawKey: string): string =>
  `${rawKey.slice(0, KEY_PREFIX.length + 6)}…`;

// ---------------------------------------------------------------- accounts

export const createAccount = async (
  name: string,
  email?: string,
): Promise<Account> => {
  const account: Account = {
    id: ulid(),
    name: name.trim(),
    email: email?.trim() || undefined,
    status: "active",
    createdAt: Date.now(),
  };
  await db.set<Account>(["account", account.id], account);
  return account;
};

/** Creates an account and issues its first key in one step (used by self-service signup). */
export const createAccountWithKey = async (
  name: string,
  email?: string,
): Promise<{ account: Account; key: string }> => {
  const account = await createAccount(name, email);
  const { key } = await issueApiKey(account.id);
  return { account, key };
};

// Tight rate limit for the public signup endpoint: 3 accounts per IP per 24 h.
const SIGNUP_RATE_MAX = 3;
const SIGNUP_RATE_WINDOW_MS = 86_400_000;
const signupBuckets = new Map<string, { count: number; resetAt: number }>();

export const checkSignupRateLimit = (ip: string): boolean => {
  const now = Date.now();
  let bucket = signupBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + SIGNUP_RATE_WINDOW_MS };
    signupBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  return bucket.count <= SIGNUP_RATE_MAX;
};

export const getAccount = async (id: string): Promise<Account | null> => {
  const record = await db.get<Account>(["account", id]);
  return record?.data ?? null;
};

export const listAccounts = async (): Promise<Account[]> => {
  const records = await db.listAll<Account>(["account", {}]);
  return records.map((record) => record.data);
};

export const setAccountStatus = async (
  id: string,
  status: AccountStatus,
): Promise<Account> => {
  const account = await getAccount(id);
  if (!account) throw new Error("Account not found");
  account.status = status;
  await db.set<Account>(["account", id], account);
  return account;
};

// ---------------------------------------------------------------- api keys

/** Issues a new key. Returns the raw key ONCE; only the hash is persisted. */
export const issueApiKey = async (
  accountId: string,
): Promise<{ key: string; record: ApiKeyRecord }> => {
  const account = await getAccount(accountId);
  if (!account) throw new Error("Account not found");

  const key = generateRawKey();
  const record: ApiKeyRecord = {
    hash: hashApiKey(key),
    accountId,
    prefix: displayPrefix(key),
    status: "active",
    createdAt: Date.now(),
  };
  await db.set<ApiKeyRecord>(["apikey", record.hash], record);
  return { key, record };
};

export const listApiKeys = async (
  accountId?: string,
): Promise<ApiKeyRecord[]> => {
  const records = (await db.listAll<ApiKeyRecord>(["apikey", {}])).map(
    (record) => record.data,
  );
  return accountId
    ? records.filter((record) => record.accountId === accountId)
    : records;
};

export const revokeApiKey = async (hash: string): Promise<void> => {
  const record = await db.get<ApiKeyRecord>(["apikey", hash]);
  if (!record) throw new Error("API key not found");
  record.data.status = "revoked";
  await db.set<ApiKeyRecord>(["apikey", hash], record.data);
};

/** Resolves a raw key to its (active) account, or null if invalid/revoked. */
export const getAccountByApiKey = async (
  rawKey: string,
): Promise<Account | null> => {
  const record = await db.get<ApiKeyRecord>(["apikey", hashApiKey(rawKey)]);
  if (!record || record.data.status !== "active") return null;

  const account = await getAccount(record.data.accountId);
  if (!account || account.status !== "active") return null;
  return account;
};

// -------------------------------------------------------------- middleware

/** A request that has passed `requireApiKey` and carries the resolved account. */
export interface AuthedRequest extends Request {
  account: Account;
}

const extractKey = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer "))
    return header.slice("Bearer ".length).trim();

  const apiKeyHeader = req.headers["x-api-key"];
  if (typeof apiKeyHeader === "string" && apiKeyHeader.length > 0)
    return apiKeyHeader;

  return null;
};

// ------------------------------------------------------- rate limiting

const RATE_LIMIT_MAX = 120; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window per-key limiter for `/api/v1`. Buckets by API key (falling back
 * to IP) so it can run *before* the account is resolved. In-memory — fine for a
 * single-process app; swap for a shared store if the poster is ever scaled out.
 */
export const rateLimitApi = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const key = extractKey(req) ?? req.ip ?? "anon";
  const now = Date.now();

  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;

  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(Math.max(0, RATE_LIMIT_MAX - bucket.count)),
  );

  if (bucket.count > RATE_LIMIT_MAX) {
    apiError(res, 429, "rate_limited", "Rate limit exceeded; slow down.");
    return;
  }
  next();
};

export const requireApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const key = extractKey(req);
    if (!key) {
      apiError(
        res,
        401,
        "unauthorized",
        "Missing API key. Send it as 'Authorization: Bearer <key>'.",
      );
      return;
    }

    const account = await getAccountByApiKey(key);
    if (!account) {
      apiError(res, 401, "unauthorized", "Invalid or revoked API key.");
      return;
    }

    (req as AuthedRequest).account = account;
    next();
  } catch (err) {
    console.error("API auth error:", err);
    apiError(res, 500, "internal", "Internal server error");
  }
};
