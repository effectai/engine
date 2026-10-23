import { createHash, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ulid } from "ulid";
import { apiError } from "./api-util.js";
import { db } from "../state.js";

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

export const updateAccount = async (
  id: string,
  changes: { name?: string; email?: string },
): Promise<Account> => {
  const account = await getAccount(id);
  if (!account) throw new Error("Account not found");
  if (changes.name !== undefined) account.name = changes.name.trim();
  if (changes.email !== undefined)
    account.email = changes.email.trim() || undefined;
  await db.set<Account>(["account", id], account);
  return account;
};

// ---------------------------------------------------------------- api keys

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
  accountId: string,
): Promise<ApiKeyRecord[]> =>
  (await db.listAll<ApiKeyRecord>(["apikey", {}]))
    .map((record) => record.data)
    .filter((record) => record.accountId === accountId);

export const getApiKey = async (hash: string): Promise<ApiKeyRecord | null> => {
  const record = await db.get<ApiKeyRecord>(["apikey", hash]);
  return record?.data ?? null;
};

export const countActiveApiKeys = async (accountId: string): Promise<number> =>
  (await listApiKeys(accountId)).filter((key) => key.status === "active")
    .length;

export const revokeApiKey = async (hash: string): Promise<void> => {
  const record = await db.get<ApiKeyRecord>(["apikey", hash]);
  if (!record) throw new Error("API key not found");
  record.data.status = "revoked";
  await db.set<ApiKeyRecord>(["apikey", hash], record.data);
};

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

export const getAccountFromRequest = async (
  req: Request,
): Promise<Account | null> => {
  const cached = (req as Partial<AuthedRequest>).account;
  if (cached) return cached;
  const key = extractKey(req);
  return key ? getAccountByApiKey(key) : null;
};

// ------------------------------------------------------- rate limiting

const RATE_LIMIT_MAX = 120; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const SIGNUP_RATE_MAX = 3; // signups per IP
const SIGNUP_RATE_WINDOW_MS = 86_400_000; // per 24 h
const buckets = new Map<string, { count: number; resetAt: number }>();

const hitBucket = (bucketKey: string, windowMs: number): number => {
  const now = Date.now();
  let bucket = buckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(bucketKey, bucket);
  }
  bucket.count += 1;
  return bucket.count;
};

setInterval(() => {
  const now = Date.now();
  for (const [bucketKey, bucket] of buckets)
    if (bucket.resetAt <= now) buckets.delete(bucketKey);
}, 60_000).unref();

export const checkSignupRateLimit = (ip: string): boolean =>
  hitBucket(`signup:${ip}`, SIGNUP_RATE_WINDOW_MS) <= SIGNUP_RATE_MAX;

export const rateLimitApi = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const presentedKey = extractKey(req);
    const account = presentedKey
      ? await getAccountByApiKey(presentedKey)
      : null;
    if (account) (req as AuthedRequest).account = account;

    const bucketKey = account ? `acct:${account.id}` : `ip:${req.ip ?? "anon"}`;
    const count = hitBucket(bucketKey, RATE_LIMIT_WINDOW_MS);

    res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, RATE_LIMIT_MAX - count)),
    );

    if (count > RATE_LIMIT_MAX) {
      apiError(res, 429, "rate_limited", "Rate limit exceeded; slow down.");
      return;
    }
    next();
  } catch (err) {
    // never let a limiter failure become an unhandled rejection
    console.error("Rate limiter error:", err);
    apiError(res, 500, "internal", "Internal server error");
  }
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

    const account =
      (req as Partial<AuthedRequest>).account ??
      (await getAccountByApiKey(key));
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
