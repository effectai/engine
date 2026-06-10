import type { Request, Response } from "express";

/**
 * Shared helpers for the external Requestor API (`/api/v1/*`).
 *
 * Every API response uses a consistent JSON envelope:
 *   success → the resource (or `{ data, ... }`)
 *   error   → `{ error: { code, message } }`
 */

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

// JSON.stringify replacer so bigint (lamport) values serialize as strings
// instead of throwing "Do not know how to serialize a BigInt".
export const bigintReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;

export const apiJson = (res: Response, data: unknown, status = 200): Response =>
  res
    .status(status)
    .type("application/json")
    .send(JSON.stringify(data, bigintReplacer));

/** JSON 404 for unmatched `/api/v1/*` routes (keeps the error envelope). */
export const apiNotFound = (req: Request, res: Response): void => {
  apiError(
    res,
    404,
    "not_found",
    `No such endpoint: ${req.method} ${req.originalUrl}`,
  );
};

export const LAMPORTS_PER_EFFECT = 1_000_000n;

/** Parses a human EFFECT amount (e.g. "10" or "0.5") into lamports. */
export const effectToLamports = (input: string): bigint => {
  const trimmed = String(input).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed))
    throw new Error("Amount must be a number with up to 6 decimals");
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  return BigInt(whole) * LAMPORTS_PER_EFFECT + BigInt(fracPadded);
};

/** Formats lamports as a trimmed EFFECT string (e.g. 1500000n → "1.5"). */
export const lamportsToEffect = (lamports: bigint): string => {
  const whole = lamports / LAMPORTS_PER_EFFECT;
  const frac = lamports % LAMPORTS_PER_EFFECT;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(6, "0").replace(/0+$/, "")}`;
};

/**
 * Wraps an async route handler so rejected promises become a clean 500
 * instead of an unhandled rejection (Express 4 does not await handlers).
 */
export const asyncHandler =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response): void => {
    Promise.resolve(handler(req, res)).catch((err) => {
      console.error("API handler error:", err);
      if (!res.headersSent)
        apiError(res, 500, "internal", "Internal server error");
    });
  };
