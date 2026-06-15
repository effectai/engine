import express from "express";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import Papa from "papaparse";
import { KV } from "@cross/kv";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import type { TaskRecord, CheckType, CheckResults } from "../src/types";

config();

const EFFECT_URL = process.env.EFFECT_URL ?? "";
const EFFECT_AUTH_KEY = process.env.EFFECT_AUTH_KEY ?? "";
const EFFECT_DATASET_ID = process.env.EFFECT_DATASET_ID ?? "";
const EFFECT_FETCHER_INDICES: Record<string, string> = {
  clarity: process.env.EFFECT_FETCHER_INDEX_CLARITY ?? "",
  clickability: process.env.EFFECT_FETCHER_INDEX_CLICKABILITY ?? "",
  compare: process.env.EFFECT_FETCHER_INDEX_COMPARE ?? "",
};
const EFFECT_POLL_INTERVAL_MS = parseInt(
  process.env.EFFECT_POLL_INTERVAL_MS ?? "60000",
  10,
);
const CANVA_APP_ID = process.env.CANVA_APP_ID ?? "";
const CANVA_JWKS_URL =
  process.env.CANVA_JWKS_URL ??
  (CANVA_APP_ID
    ? `https://api.canva.com/rest/v1/apps/${CANVA_APP_ID}/jwks`
    : "");
const ALLOW_UNVERIFIED_TOKENS =
  process.env.ALLOW_UNVERIFIED_TOKENS === "true";
// REVIEW_MODE lets a Canva reviewer see the full submit -> pending -> complete
// flow in seconds without real Effect workers: submissions still rehost images
// on IPFS, but skip the task-poster import and auto-complete with synthetic
// results after a short delay. MUST be off once the app is public - it
// fabricates results.
const REVIEW_MODE = process.env.REVIEW_MODE === "true";
const REVIEW_COMPLETE_DELAY_MS = parseInt(
  process.env.REVIEW_COMPLETE_DELAY_MS ?? "10000",
  10,
);

console.log("[config] EFFECT_URL:", EFFECT_URL || "(not set)");
console.log("[config] EFFECT_DATASET_ID:", EFFECT_DATASET_ID || "(not set)");
console.log("[config] EFFECT_FETCHER_INDICES:", JSON.stringify(EFFECT_FETCHER_INDICES));
console.log("[config] EFFECT_AUTH_KEY:", EFFECT_AUTH_KEY ? "(set)" : "(not set)");
console.log("[config] CANVA_APP_ID:", CANVA_APP_ID || "(not set)");
console.log("[config] CANVA_JWKS_URL:", CANVA_JWKS_URL || "(not set)");
if (ALLOW_UNVERIFIED_TOKENS) {
  console.warn(
    "[config] ALLOW_UNVERIFIED_TOKENS=true - JWT signatures are NOT verified. Local dev only.",
  );
}
if (REVIEW_MODE) {
  console.warn(
    `[config] REVIEW_MODE=true - submissions skip the task-poster and auto-complete with FAKE results in ${REVIEW_COMPLETE_DELAY_MS}ms (IPFS rehost still runs). Canva review only; never enable in production.`,
  );
}

const FETCH_TIMEOUT_MS = 10_000;
// A healthy download/pin finishes in well under a second; this is just a
// ceiling so a stalled socket fails fast enough to leave room for a retry.
const IPFS_TIMEOUT_MS = 15_000;
const IPFS_HOST = process.env.IPFS_HOST;
const MIN_WORKERS = 1;
const MAX_WORKERS = 20;

function fetcherIndex(checkType: string): string {
  return EFFECT_FETCHER_INDICES[checkType] ?? "";
}

// One download + pin attempt. Logs timing per step so we can see which leg
// stalls if the abort fires.
async function uploadToIpfsOnce(sourceUrl: string): Promise<string> {
  const downloadStart = Date.now();
  const sourceRes = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(IPFS_TIMEOUT_MS),
  });
  if (!sourceRes.ok) {
    throw new Error(`download failed: HTTP ${sourceRes.status}`);
  }
  const contentType = sourceRes.headers.get("content-type") ?? "image/png";
  const extension = contentType.split("/")[1]?.split(";")[0] ?? "png";
  const imageBlob = await sourceRes.blob();
  console.log(
    `[ipfs] downloaded ${imageBlob.size} bytes in ${Date.now() - downloadStart}ms`,
  );

  const formData = new FormData();
  formData.append("path", imageBlob, `canva-export.${extension}`);

  const addStart = Date.now();
  const ipfsRes = await fetch(`https://${IPFS_HOST}/api/v0/add?pin=true`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(IPFS_TIMEOUT_MS),
  });
  if (!ipfsRes.ok) {
    throw new Error(`IPFS add failed: HTTP ${ipfsRes.status}`);
  }
  const result = await ipfsRes.json();
  const cid = result.Hash || result.cid || result.id;
  if (!cid) throw new Error("IPFS response missing CID");
  console.log(`[ipfs] pinned in ${Date.now() - addStart}ms`);

  return `https://${IPFS_HOST}/ipfs/${cid}`;
}

async function rehostImageOnIpfs(sourceUrl: string): Promise<string> {
  if (!sourceUrl) return sourceUrl;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const hostedUrl = await uploadToIpfsOnce(sourceUrl);
      console.log(`[ipfs] re-hosted image -> ${hostedUrl}`);
      return hostedUrl;
    } catch (err: any) {
      const message = err?.message ?? err;
      if (attempt < maxAttempts) {
        console.warn(`[ipfs] attempt ${attempt} failed (${message}), retrying`);
      } else {
        console.error(
          `[ipfs] re-host failed after ${maxAttempts} attempts, falling back to source URL:`,
          message,
        );
      }
    }
  }
  return sourceUrl;
}

function isConfigured(): boolean {
  return Boolean(EFFECT_URL && EFFECT_AUTH_KEY && EFFECT_DATASET_ID);
}

function effectCookie(): string {
  return `auth_token=${EFFECT_AUTH_KEY}`;
}

const jwks = CANVA_JWKS_URL
  ? jwksClient({
      jwksUri: CANVA_JWKS_URL,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

function getSigningKey(
  header: jwt.JwtHeader,
  callback: (err: Error | null, key?: string) => void,
): void {
  if (!jwks || !header.kid) {
    callback(new Error("JWKS client not configured"));
    return;
  }
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      callback(err ?? new Error("Signing key not found"));
      return;
    }
    callback(null, key.getPublicKey());
  });
}

async function verifyCanvaToken(token: string): Promise<string | null> {
  if (ALLOW_UNVERIFIED_TOKENS) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1]!, "base64url").toString(),
      );
      return payload.sub ?? payload.userId ?? null;
    } catch {
      return null;
    }
  }
  if (!jwks || !CANVA_APP_ID) return null;
  return new Promise((resolve) => {
    jwt.verify(
      token,
      getSigningKey,
      { audience: CANVA_APP_ID, algorithms: ["RS256"], clockTolerance: 30 },
      (err, decoded) => {
        if (err || !decoded || typeof decoded === "string") {
          if (err) {
            console.warn("[auth] JWT verification failed:", err.message);
          }
          resolve(null);
          return;
        }
        const payload = decoded as jwt.JwtPayload;
        resolve(
          (payload.sub as string | undefined) ??
            (payload as any).userId ??
            null,
        );
      },
    );
  });
}

async function getCanvaId(req: express.Request): Promise<string | null> {
  const token = req.headers["x-canva-user-token"];
  if (typeof token !== "string") return null;
  return verifyCanvaToken(token);
}

declare global {
  namespace Express {
    interface Request {
      canvaId?: string;
    }
  }
}

function requireCanvaId(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  getCanvaId(req)
    .then((id) => {
      if (!id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      req.canvaId = id;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Unauthorized" });
    });
}

function parseCsv(text: string): Record<string, string>[] {
  const { data } = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
  });
  return data;
}

function aggregateResults(answers: any[]): CheckResults | undefined {
  const completions = answers.length;
  const checkType: CheckType = answers[0]?.checkType;
  const toFeedback = (answer: any, rating: string) => ({
    rating,
    ...(answer.insight ? { insight: answer.insight } : {}),
  });

  if (checkType === "clarity") {
    const avg = answers.reduce((sum, answer) => sum + (Number(answer.score) || 0), 0) / completions;
    const feedback = answers.map((answer) => toFeedback(answer, `${Number(answer.score) || 0}/10`));
    return { kind: "clarity", score: Math.round(avg * 10) / 10, feedback };
  }
  if (checkType === "clickability") {
    const clicks = answers.filter((answer) => answer.wouldClick).length;
    const feedback = answers.map((answer) => toFeedback(answer, answer.wouldClick ? "Yes" : "No"));
    return { kind: "clickability", stopScrollPercent: Math.round((clicks / completions) * 100), feedback };
  }
  if (checkType === "compare") {
    const aWins = answers.filter((answer) => answer.winner === "A").length;
    const feedback = answers.map((answer) => toFeedback(answer, answer.winner === "A" ? "A" : "B"));
    return { kind: "compare", winner: aWins > completions / 2 ? "A" : "B", dimensionsWon: Math.max(aWins, completions - aWins), dimensionsTotal: completions, feedback };
  }
  return undefined;
}

// Canned insights for REVIEW_MODE synthetic answers so the results screen looks
// realistic to a reviewer (not just bare scores).
const REVIEW_INSIGHTS = [
  "Strong focal point, but the headline could be a touch larger.",
  "Clear call to action - I knew exactly what to do.",
  "Colors work well together and the contrast is good.",
  "A little busy in the center; some more whitespace would help.",
  "The value proposition reads instantly.",
];

// Build `count` plausible answers for REVIEW_MODE, shaped exactly like the real
// worker answers aggregateResults expects per check type.
function synthesizeAnswers(checkType: CheckType, count: number): any[] {
  const answers: any[] = [];
  for (let index = 0; index < count; index++) {
    const insight = REVIEW_INSIGHTS[index % REVIEW_INSIGHTS.length];
    if (checkType === "clarity") {
      answers.push({ checkType, score: 7 + (index % 4), insight }); // 7..10
    } else if (checkType === "clickability") {
      answers.push({ checkType, wouldClick: index % 3 !== 0, insight }); // ~2/3 yes
    } else {
      answers.push({ checkType, winner: index % 3 === 0 ? "B" : "A", insight }); // mostly A
    }
  }
  return answers;
}

export const db = new KV({ autoSync: true });

// REVIEW_MODE only: after a short delay, flip a faked task to complete with
// synthetic aggregated results. No-ops if the reviewer deleted it or it already
// completed (e.g. a duplicate timer after a restart-time reschedule).
function scheduleReviewCompletion(
  taskId: string,
  checkType: CheckType,
  count: number,
): void {
  setTimeout(async () => {
    try {
      const entry = await db.get<TaskRecord>(["canva-task", taskId]);
      if (!entry || entry.data.status === "complete") return;
      const results = aggregateResults(synthesizeAnswers(checkType, count));
      await db.set<TaskRecord>(["canva-task", taskId], {
        ...entry.data,
        status: "complete",
        results,
      });
      pendingTasks.delete(taskId);
      console.log(
        `[review] task ${taskId} auto-completed (${count} synthetic answers)`,
      );
    } catch (err: any) {
      console.error(
        `[review] auto-complete failed for ${taskId}:`,
        err?.message ?? err,
      );
    }
  }, REVIEW_COMPLETE_DELAY_MS);
}

// Canva user IDs can contain characters @cross/kv rejects in key strings (it
// only permits letters, numbers, '@', '-', '_'). base64url-encode the id into a
// valid, collision-free key element. Must be used everywhere canvaId is a key
function userKeyPart(canvaId: string): string {
  return Buffer.from(canvaId).toString("base64url");
}

let answersByTaskId = new Map<string, any[]>();
const pendingTasks = new Map<string, number>();
let lastCsvRowCount = -1;

async function updatePendingTasksFromCache(): Promise<void> {
  // Iterate only pending tasks (bounded) instead of scanning the whole DB.
  for (const [taskId, workerCount] of pendingTasks) {
    const answers = answersByTaskId.get(taskId);
    if (!answers || answers.length < workerCount) continue;

    const entry = await db.get<TaskRecord>(["canva-task", taskId]);
    if (!entry) {
      pendingTasks.delete(taskId);
      continue;
    }

    const results = aggregateResults(answers);
    await db.set<TaskRecord>(entry.key, {
      ...entry.data,
      status: "complete",
      results,
    });
    pendingTasks.delete(taskId);
    console.log(
      `[cache] task ${taskId} marked complete (${answers.length} completions)`,
    );
  }
}

let refreshInFlight = false;

async function refreshCsvCache(): Promise<void> {
  if (!isConfigured()) return;
  if (refreshInFlight) {
    console.log("[cache] refresh skipped - previous run still in flight");
    return;
  }
  refreshInFlight = true;
  try {
    const fetchers = Object.values(EFFECT_FETCHER_INDICES).filter(Boolean);
    const csvTexts = await Promise.all(
      fetchers.map(async (indexId) => {
        const url = `${EFFECT_URL}/d/${EFFECT_DATASET_ID}/f/${indexId}/download`;
        const response = await fetch(url, {
          headers: { Cookie: effectCookie() },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        return response.ok ? response.text() : "";
      }),
    );
    let headerLine = "";
    const dataLines: string[] = [];
    for (const csv of csvTexts) {
      const lines = csv.trim().split(/\r?\n/).filter(Boolean);
      if (!lines.length) continue;
      if (!headerLine) headerLine = lines[0]!;
      dataLines.push(...lines.slice(1));
    }

    if (dataLines.length === lastCsvRowCount) {
      console.log(
        `[cache] unchanged - ${dataLines.length} rows, skipping reconcile`,
      );
      return;
    }

    const text = headerLine ? [headerLine, ...dataLines].join("\n") : "";
    const rows = text.trim() ? parseCsv(text) : [];

    // Group answers by taskId in a single pass (parse each row exactly once),
    const grouped = new Map<string, any[]>();
    for (const row of rows) {
      let answer: any;
      try {
        answer = JSON.parse(row["result"] ?? "")?.values?.answer;
      } catch {
        continue;
      }
      const taskId = answer?.taskId;
      if (!taskId) continue;
      const bucket = grouped.get(taskId);
      if (bucket) bucket.push(answer);
      else grouped.set(taskId, [answer]);
    }
    answersByTaskId = grouped;
    console.log(
      `[cache] refreshed - ${rows.length} rows across ${grouped.size} tasks at ${new Date().toISOString()}`,
    );

    await updatePendingTasksFromCache();
    lastCsvRowCount = dataLines.length;
  } catch (err: any) {
    console.error("[cache] refresh failed:", err?.message ?? err);
  } finally {
    refreshInFlight = false;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CANVA_ORIGIN_REGEX = /^https:\/\/([a-z0-9-]+\.)*(canva\.com|canva-apps\.com)$/i;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (typeof origin === "string" && CANVA_ORIGIN_REGEX.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Canva-User-Token");
  next();
});
app.options("*", (_req, res) => res.sendStatus(204));

const taskRateLimit = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.canvaId ?? req.ip ?? "unknown",
});

// POST /api/task - import one task row into the Effect AI fetcher and record it in the DB
app.post("/api/task", requireCanvaId, taskRateLimit, async (req, res) => {
  const canvaId = req.canvaId!;

  console.log("[POST /api/task] received body:", JSON.stringify(req.body));

  const {
    checkType,
    context,
    workerCount,
    imageUrl,
    imageUrlA,
    imageUrlB,
    versionLabelA,
    versionLabelB,
    revealDuration,
  } = req.body;

  const taskId = `T-${randomUUID()}`;
  console.log(`[POST /api/task] generated taskId=${taskId} checkType=${checkType} workerCount=${workerCount}`);

  const count = Math.min(
    MAX_WORKERS,
    Math.max(MIN_WORKERS, Number(workerCount) || 5),
  );

  const [hostedImageUrl, hostedImageUrlA, hostedImageUrlB] = await Promise.all([
    rehostImageOnIpfs(imageUrl || ""),
    rehostImageOnIpfs(imageUrlA || ""),
    rehostImageOnIpfs(imageUrlB || ""),
  ]);

  // REVIEW_MODE: IPFS rehost above still ran, but skip the task-poster import and
  // real-worker wait - store the record as pending and auto-complete it shortly
  // so a Canva reviewer sees the whole flow without live workers.
  if (REVIEW_MODE) {
    const record: TaskRecord = {
      taskId,
      canvaId,
      checkType,
      status: "pending",
      submittedAt: new Date().toISOString(),
      workerCount: count,
      context: context ?? { designPurpose: "", targetAudience: "", mainGoal: "" },
      imageUrl,
      imageUrlA,
      imageUrlB,
      versionLabelA,
      versionLabelB,
      revealDuration,
    };
    await db.set<TaskRecord>(["canva-task", taskId], record);
    await db.set(["canva-user-task", userKeyPart(canvaId), taskId], { taskId });
    scheduleReviewCompletion(taskId, checkType, count);
    console.log(
      `[review] task ${taskId} created - synthetic completion in ${REVIEW_COMPLETE_DELAY_MS}ms`,
    );
    return res.json({ taskId });
  }

  const row = {
    taskId,
    checkType,
    imageUrl: hostedImageUrl || hostedImageUrlA || "",
    imageUrlA: hostedImageUrlA || "",
    imageUrlB: hostedImageUrlB || "",
    labelA: versionLabelA || "A",
    labelB: versionLabelB || "B",
    purpose: context?.designPurpose || "",
    audience: context?.targetAudience || "",
    goal: context?.mainGoal || "",
    workerCount: count,
    revealDuration: revealDuration || 3,
  };

  const csv = Papa.unparse(Array.from({ length: count }, () => row));
  const importUrl = `${EFFECT_URL}/d/${EFFECT_DATASET_ID}/f/${fetcherIndex(checkType)}/import`;
  console.log(`[POST /api/task] POSTing CSV to ${importUrl}`);

  try {
    const importRes = await fetch(importUrl, {
      method: "POST",
      headers: {
        Cookie: effectCookie(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ csv, delimiter: "," }).toString(),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    console.log(`[POST /api/task] task-poster responded: HTTP ${importRes.status}`);

    if (!importRes.ok) {
      const detail = await importRes.text();
      console.error("[POST /api/task] import failed:", detail);
      return res.status(500).json({ error: "Import failed", detail });
    }

    const record: TaskRecord = {
      taskId,
      canvaId,
      checkType,
      status: "pending",
      submittedAt: new Date().toISOString(),
      workerCount: count,
      context: context ?? { designPurpose: "", targetAudience: "", mainGoal: "" },
      imageUrl,
      imageUrlA,
      imageUrlB,
      versionLabelA,
      versionLabelB,
      revealDuration,
    };
    await db.set<TaskRecord>(["canva-task", taskId], record);
    await db.set(["canva-user-task", userKeyPart(canvaId), taskId], { taskId });

    pendingTasks.set(taskId, count);
    console.log(`[POST /api/task] success - taskId=${taskId}`);
    return res.json({ taskId });
  } catch (err: any) {
    console.error("[POST /api/task] fetch threw:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Failed to submit task" });
  }
});

// GET /api/tasks - return task records for the requesting Canva user
app.get("/api/tasks", requireCanvaId, async (req, res) => {
  const canvaId = req.canvaId!;
  try {
    const indexEntries = await db.listAll<{ taskId: string }>([
      "canva-user-task",
      userKeyPart(canvaId),
      {},
    ]);
    const records = await Promise.all(
      indexEntries.map((indexEntry) =>
        db.get<TaskRecord>(["canva-task", indexEntry.data.taskId]),
      ),
    );
    const tasks = records
      .map((entry) => entry?.data)
      .filter((task): task is TaskRecord => Boolean(task))
      .sort(
        (taskA, taskB) =>
          new Date(taskB.submittedAt).getTime() -
          new Date(taskA.submittedAt).getTime(),
      );
    console.log(
      `[GET /api/tasks] user ${canvaId} - ${tasks.length} tasks via index`,
    );
    return res.json(tasks);
  } catch (err: any) {
    console.error("[GET /api/tasks] error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Failed to fetch tasks" });
  }
});

// GET /api/task/:taskId - return a single task record from the DB
app.get("/api/task/:taskId", requireCanvaId, async (req, res) => {
  const taskId = req.params["taskId"]!;
  const canvaId = req.canvaId!;
  try {
    const entry = await db.get<TaskRecord>(["canva-task", taskId]);
    if (!entry || entry.data.canvaId !== canvaId) {
      return res.status(404).json({ error: "Task not found" });
    }
    const task = entry.data;
    if (task.status !== "complete") {
      return res.json({ status: "pending", completions: 0, workerCount: task.workerCount });
    }
    const completions = (task.results as any)?.feedback?.length ?? task.workerCount;
    return res.json({ status: "complete", completions, workerCount: task.workerCount, results: task.results });
  } catch (err: any) {
    console.error(`[GET /api/task/${taskId}] error:`, err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Failed to fetch task" });
  }
});

// DELETE /api/task/:taskId - remove a task record owned by the requesting Canva user
app.delete("/api/task/:taskId", requireCanvaId, async (req, res) => {
  const taskId = req.params["taskId"]!;
  const canvaId = req.canvaId!;
  try {
    const entry = await db.get<TaskRecord>(["canva-task", taskId]);
    if (!entry || entry.data.canvaId !== canvaId) {
      return res.status(404).json({ error: "Task not found" });
    }
    await db.delete(["canva-task", taskId]);
    await db.delete(["canva-user-task", userKeyPart(canvaId), taskId]);
    pendingTasks.delete(taskId);
    console.log(`[DELETE /api/task/${taskId}] deleted`);
    return res.sendStatus(204);
  } catch (err: any) {
    console.error(`[DELETE /api/task/${taskId}] error:`, err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Failed to delete task" });
  }
});

const main = async () => {
  const dbFile = process.env.DB_FILE || "mydatabase.db";
  console.log(`Opening database at ${dbFile}`);
  await db.open(dbFile);

  const allTasks = await db.listAll<TaskRecord>(["canva-task", {}]);
  for (const entry of allTasks) {
    const task = entry.data;
    if (task.canvaId) {
      await db.set(["canva-user-task", userKeyPart(task.canvaId), task.taskId], {
        taskId: task.taskId,
      });
    }
    if (task.status !== "complete") {
      pendingTasks.set(task.taskId, task.workerCount);
      // In REVIEW_MODE the reconcile loop never sees Effect answers for these
      // faked tasks, so re-arm their synthetic completion across restarts.
      if (REVIEW_MODE) {
        scheduleReviewCompletion(task.taskId, task.checkType, task.workerCount);
      }
    }
  }
  console.log(
    `[startup] indexed ${allTasks.length} tasks, ${pendingTasks.size} pending`,
  );

  refreshCsvCache();
  setInterval(refreshCsvCache, EFFECT_POLL_INTERVAL_MS);

  const port = parseInt(process.env.CANVA_BACKEND_PORT ?? "3002", 10);
  app.listen(port, () =>
    console.log(`Canva backend on :${port} - Effect AI: ${EFFECT_URL || "not configured"}`),
  );
};

main();
