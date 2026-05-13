import express from "express";
import { config } from "dotenv";
import Papa from "papaparse";
import { KV } from "@cross/kv";
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

console.log("[config] EFFECT_URL:", EFFECT_URL || "(not set)");
console.log("[config] EFFECT_DATASET_ID:", EFFECT_DATASET_ID || "(not set)");
console.log("[config] EFFECT_FETCHER_INDICES:", JSON.stringify(EFFECT_FETCHER_INDICES));
console.log("[config] EFFECT_AUTH_KEY:", EFFECT_AUTH_KEY ? "(set)" : "(not set)");

function fetcherIndex(checkType: string): string {
  return EFFECT_FETCHER_INDICES[checkType] ?? "";
}

function isConfigured(): boolean {
  return Boolean(EFFECT_URL && EFFECT_AUTH_KEY && EFFECT_DATASET_ID);
}

function effectCookie(): string {
  return `auth_token=${EFFECT_AUTH_KEY}`;
}

function getCanvaId(req: express.Request): string | null {
  const token = req.headers["x-canva-user-token"];
  if (typeof token !== "string") return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
    return payload.sub ?? payload.userId ?? null;
  } catch {
    return null;
  }
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

export const db = new KV({ autoSync: true });

// In-memory cache of merged CSV rows, refreshed on a schedule.
let cachedRows: Record<string, string>[] = [];

async function updatePendingTasksFromCache(): Promise<void> {
  const entries = await db.listAll<TaskRecord>(["canva-task", {}]);
  for (const entry of entries) {
    const task = entry.data;
    if (task.status === "complete") continue;

    const rows = cachedRows.filter((row) => {
      try {
        return JSON.parse(row["result"] ?? "")?.values?.answer?.taskId === task.taskId;
      } catch {
        return false;
      }
    });
    if (!rows.length) continue;

    const answers = rows
      .map((row) => { try { return JSON.parse(row["result"] ?? "")?.values?.answer; } catch { return null; } })
      .filter(Boolean);

    if (answers.length < task.workerCount) continue;

    const results = aggregateResults(answers);
    await db.set<TaskRecord>(entry.key, { ...task, status: "complete", results });
    console.log(`[cache] task ${task.taskId} marked complete (${answers.length} completions)`);
  }
}

async function refreshCsvCache(): Promise<void> {
  if (!isConfigured()) return;
  try {
    const fetchers = Object.values(EFFECT_FETCHER_INDICES).filter(Boolean);
    const csvTexts = await Promise.all(
      fetchers.map(async (indexId) => {
        const url = `${EFFECT_URL}/d/${EFFECT_DATASET_ID}/f/${indexId}/download`;
        const r = await fetch(url, { headers: { Cookie: effectCookie() } });
        return r.ok ? r.text() : "";
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
    const text = headerLine ? [headerLine, ...dataLines].join("\n") : "";
    cachedRows = text.trim() ? parseCsv(text) : [];
    console.log(`[cache] refreshed — ${cachedRows.length} rows at ${new Date().toISOString()}`);

    await updatePendingTasksFromCache();
  } catch (err: any) {
    console.error("[cache] refresh failed:", err?.message ?? err);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Canva-User-Token");
  next();
});
app.options("*", (_req, res) => res.sendStatus(204));

// POST /api/task — import one task row into the Effect AI fetcher and record it in the DB
app.post("/api/task", async (req, res) => {
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

  const taskId = `T-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  console.log(`[POST /api/task] generated taskId=${taskId} checkType=${checkType} workerCount=${workerCount}`);

  const count = Number(workerCount) || 5;
  const row = {
    taskId,
    checkType,
    imageUrl: imageUrl || imageUrlA || "",
    imageUrlA: imageUrlA || "",
    imageUrlB: imageUrlB || "",
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
    });

    console.log(`[POST /api/task] task-poster responded: HTTP ${importRes.status}`);

    if (!importRes.ok) {
      const detail = await importRes.text();
      console.error("[POST /api/task] import failed:", detail);
      return res.status(500).json({ error: "Import failed", detail });
    }

    const record: TaskRecord = {
      taskId,
      canvaId: getCanvaId(req) ?? undefined,
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
    console.log(`[POST /api/task] success — taskId=${taskId}`);
    return res.json({ taskId });
  } catch (err: any) {
    console.error("[POST /api/task] fetch threw:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Failed to submit task" });
  }
});

// GET /api/tasks — return task records for the requesting Canva user
app.get("/api/tasks", async (req, res) => {
  const canvaId = getCanvaId(req);
  try {
    const entries = await db.listAll<TaskRecord>(["canva-task", {}]);
    const tasks = entries
      .map((entry) => entry.data)
      .filter((task) => !canvaId || task.canvaId === canvaId)
      .sort(
        (taskA, taskB) =>
          new Date(taskB.submittedAt).getTime() -
          new Date(taskA.submittedAt).getTime(),
      );
    return res.json(tasks);
  } catch (err: any) {
    console.error("[GET /api/tasks] error:", err?.message ?? err);
    return res.status(500).json({ error: err?.message ?? "Failed to fetch tasks" });
  }
});

// GET /api/task/:taskId — return a single task record from the DB
app.get("/api/task/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const canvaId = getCanvaId(req);
  try {
    const entry = await db.get<TaskRecord>(["canva-task", taskId]);
    if (!entry || (canvaId && entry.data.canvaId !== canvaId)) {
      return res.json({ status: "pending", completions: 0, workerCount: 0 });
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

// DELETE /api/task/:taskId — remove a task record owned by the requesting Canva user
app.delete("/api/task/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const canvaId = getCanvaId(req);
  try {
    const entry = await db.get<TaskRecord>(["canva-task", taskId]);
    if (!entry || (canvaId && entry.data.canvaId !== canvaId)) {
      return res.status(404).json({ error: "Task not found" });
    }
    await db.delete(["canva-task", taskId]);
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

  refreshCsvCache();
  setInterval(refreshCsvCache, EFFECT_POLL_INTERVAL_MS);

  const port = parseInt(process.env.CANVA_BACKEND_PORT ?? "3002", 10);
  app.listen(port, () =>
    console.log(`Canva backend on :${port} — Effect AI: ${EFFECT_URL || "not configured"}`),
  );
};

main();
