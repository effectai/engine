import type { Request, Response } from "express";

const DEFAULT_PAGE_LIMIT = 100;
const MAX_PAGE_LIMIT = 1000;

export const parsePagination = (
  query: Record<string, unknown>,
): { limit: number; offset: number } => ({
  limit: Math.min(
    Math.max(Number(query.limit) || DEFAULT_PAGE_LIMIT, 1),
    MAX_PAGE_LIMIT,
  ),
  offset: Math.max(Number(query.offset) || 0, 0),
});

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_request"
  | "insufficient_credits"
  | "rate_limited"
  | "internal";

export const apiError = (
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
): Response => res.status(status).json({ error: { code, message } });

const bigintReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;

export const apiJson = (res: Response, data: unknown, status = 200): Response =>
  res
    .status(status)
    .type("application/json")
    .send(JSON.stringify(data, bigintReplacer));

export const apiNotFound = (req: Request, res: Response): void => {
  apiError(
    res,
    404,
    "not_found",
    `No such endpoint: ${req.method} ${req.originalUrl}`,
  );
};

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const LAMPORTS_PER_EFFECT = 1_000_000n;

export const effectToLamports = (input: string): bigint => {
  const trimmed = String(input).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed))
    throw new Error("Amount must be a number with up to 6 decimals");
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  return BigInt(whole) * LAMPORTS_PER_EFFECT + BigInt(fracPadded);
};

export const lamportsToEffect = (lamports: bigint): string => {
  const whole = lamports / LAMPORTS_PER_EFFECT;
  const frac = lamports % LAMPORTS_PER_EFFECT;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(6, "0").replace(/0+$/, "")}`;
};

const locks = new Map<string, Promise<void>>();

export const withLock = <ResultType>(
  lockKey: string,
  operation: () => Promise<ResultType>,
): Promise<ResultType> => {
  const previous = locks.get(lockKey) ?? Promise.resolve();
  const run = previous.then(operation, operation);
  const tail = run.then(
    () => undefined,
    () => undefined,
  );
  locks.set(lockKey, tail);
  tail.then(() => {
    if (locks.get(lockKey) === tail) locks.delete(lockKey);
  });
  return run;
};

export const asyncHandler =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response): void => {
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error("API handler error:", err);
      if (!res.headersSent)
        apiError(res, 500, "internal", "Internal server error");
    });
  };
