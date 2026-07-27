import type { Task } from "@effectai/protocol";
import type { Express, Request, Response } from "express";
import { ulid } from "ulid";
import {
  type Account,
  type AuthedRequest,
  listApiKeys,
  requireApiKey,
} from "./accounts.js";
import {
  type ApiErrorCode,
  apiError,
  apiJson,
  asyncHandler,
  effectToLamports,
  lamportsToEffect,
  parsePagination,
  withLock,
} from "./api-util.js";
import { type DatasetRecord, getDataset, writeDataset } from "../dataset.js";
import {
  type Fetcher,
  countTasks,
  createFetcher,
  getFetcher,
  importCsvIntoFetcher,
  parseCsv,
  writeFetcher,
} from "../fetcher.js";
import {
  InsufficientCreditsError,
  debit,
  getBalance,
  refund,
} from "./ledger.js";
import { isRequestableCapability } from "@effectai/capabilities";
import { db } from "../state.js";
import {
  getAccountTemplateIds,
  getTemplate,
  getTemplateFields,
  isTemplateApproved,
  type TemplateRecord,
} from "../templates.js";

export type JobType = "csv" | "constant";
export type JobStatus = "active" | "cancelled";

export type Job = {
  id: string;
  accountId: string;
  datasetId: number;
  fetcherIndex: number;
  type: JobType;
  name: string;
  templateId: string;
  rewardLamports: string; // per task
  taskCount: number;
  reservedLamports: string;
  consumedLamports: string;
  refundedLamports: string;
  status: JobStatus;
  // When true, each worker may complete at most one task in this job (no repeats). 
  uniqueWorker: boolean;
  createdAt: number;
};

const MAX_TASKS_PER_JOB = 10_000;
const MIN_REWARD_LAMPORTS = 1_000n; // 0.001 EFFECT
const MAX_REWARD_LAMPORTS = 100_000_000n; // 100 EFFECT (matches the legacy price cap)
const MAX_JOB_COST_LAMPORTS = 1_000_000_000_000n; // 1,000,000 EFFECT per job
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_FREQUENCY_SECONDS = 2;
const DEFAULT_TIME_LIMIT_SECONDS = 600;
// Time-limit bounds match the legacy team UI (`formValidations` in fetcher.ts).
const MIN_TIME_LIMIT_SECONDS = 60;
const MAX_TIME_LIMIT_SECONDS = 86_400;
const MAX_JOB_NAME_LENGTH = 200;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

let lastDatasetId = 0;
const nextDatasetId = (): number => {
  const id = Math.max(Date.now(), lastDatasetId + 1);
  lastDatasetId = id;
  return id;
};

// ------------------------------------------------------------- job storage

export const writeJob = (job: Job): Promise<void> =>
  db.set<Job>(["job", job.accountId, job.id], job);

export const getJob = async (
  accountId: string,
  jobId: string,
): Promise<Job | null> => {
  const record = await db.get<Job>(["job", accountId, jobId]);
  return record?.data ?? null;
};

export const listJobs = async (accountId: string): Promise<Job[]> =>
  (await db.listAll<Job>(["job", accountId, {}])).map((record) => record.data);

// reverse lookup used by the per-task refunds in processResults
export const getJobByDataset = async (
  datasetId: number,
): Promise<Job | null> => {
  const ref = await db.get<{ accountId: string; jobId: string }>([
    "job-by-dataset",
    datasetId,
  ]);
  return ref ? getJob(ref.data.accountId, ref.data.jobId) : null;
};

export const deleteAccountAndData = async (
  accountId: string,
): Promise<void> => {

  for (const job of await listJobs(accountId)) {
    const fetcher = await getFetcher(job.datasetId, job.fetcherIndex);
    if (fetcher) {
      fetcher.status = "archived";
      await writeFetcher(fetcher);
    }
    const dataset = await getDataset(job.datasetId);
    if (dataset) {
      dataset.data.status = "archived";
      await writeDataset(job.datasetId, dataset.data);
    }
    await db.delete(["job-by-dataset", job.datasetId]);
    await db.delete(["job", accountId, job.id]);
  }

  for (const key of await listApiKeys(accountId)) {
    await db.delete(["apikey", key.hash]);
  }

  for (const entry of await db.listAll(["ledger-entry", accountId, {}])) {
    await db.delete(entry.key);
  }
  await db.delete(["ledger", accountId]);

  for (const ref of await db.listAll(["account-template", accountId, {}])) {
    await db.delete(ref.key);
  }

  await db.delete(["account", accountId]);
};

// ----------------------------------------------------------------- helpers

// A requestor may use a template if it's approved (incl. team defaults) or if
// they own it (their own unapproved templates run sandboxed with a warning).
const resolveUsableTemplate = async (
  accountId: string,
  templateId: string,
): Promise<TemplateRecord | null> => {
  const record = await getTemplate(templateId);
  if (!record) return null;
  if (record.data.status === "archived") return null;
  if (isTemplateApproved(record.data)) return record.data;
  const owned = (await getAccountTemplateIds(accountId)).includes(templateId);
  return owned ? record.data : null;
};

const missingTemplateFields = (html: string, headers: string[]): string[] => {
  const have = new Set(headers);
  return getTemplateFields(html).filter((field) => !have.has(field));
};

type JobAnalysis =
  | { ok: false; status: number; code: ApiErrorCode; message: string }
  | {
      ok: true;
      type: JobType;
      name: string;
      templateId: string;
      capability: string;
      timeLimitSeconds: number;
      uniqueWorker: boolean;
      rewardLamports: bigint;
      taskCount: number;
      cost: bigint;
      csv: string;
      constantData: string;
    };

const fail = (
  status: number,
  code: ApiErrorCode,
  message: string,
): JobAnalysis => ({ ok: false, status, code, message });

const analyzeJob = async (
  accountId: string,
  body: Record<string, unknown>,
): Promise<JobAnalysis> => {
  const type = (String(body.type ?? "csv") as JobType) || "csv";
  const name = String(body.name ?? "").trim() || "Untitled job";
  const templateId = String(body.templateId ?? "");
  const capability = String(body.capability ?? "").trim();
  const uniqueWorker =
    body.uniqueWorker === true || body.uniqueWorker === "true";

  if (name.length > MAX_JOB_NAME_LENGTH)
    return fail(
      400,
      "invalid_request",
      `'name' must be ${MAX_JOB_NAME_LENGTH} characters or fewer.`,
    );
  // Closed vocabulary: a typo'd capability would silently produce a job no
  // worker can ever see, so reject anything outside the known list.
  if (capability && !isRequestableCapability(capability))
    return fail(
      400,
      "invalid_request",
      "Unknown 'capability'. Use an id from GET /api/v1/capabilities, or omit it to allow any worker.",
    );

  const timeLimitSeconds =
    body.timeLimitSeconds === undefined
      ? DEFAULT_TIME_LIMIT_SECONDS
      : Number(body.timeLimitSeconds);
  if (
    !Number.isInteger(timeLimitSeconds) ||
    timeLimitSeconds < MIN_TIME_LIMIT_SECONDS ||
    timeLimitSeconds > MAX_TIME_LIMIT_SECONDS
  )
    return fail(
      400,
      "invalid_request",
      `'timeLimitSeconds' must be an integer between ${MIN_TIME_LIMIT_SECONDS} and ${MAX_TIME_LIMIT_SECONDS}.`,
    );

  if (!templateId)
    return fail(400, "invalid_request", "'templateId' is required.");

  const template = await resolveUsableTemplate(accountId, templateId);

  if (!template) return fail(404, "not_found", "Template not found.");

  let rewardLamports: bigint;
  try {
    rewardLamports = effectToLamports(String(body.reward ?? ""));
  } catch {
    return fail(
      400,
      "invalid_request",
      "'reward' must be an EFFECT amount (e.g. 0.5).",
    );
  }
  if (rewardLamports < MIN_REWARD_LAMPORTS)
    return fail(
      400,
      "invalid_request",
      `'reward' must be at least ${lamportsToEffect(MIN_REWARD_LAMPORTS)} EFFECT.`,
    );
  if (rewardLamports > MAX_REWARD_LAMPORTS)
    return fail(
      400,
      "invalid_request",
      `'reward' must be at most ${lamportsToEffect(MAX_REWARD_LAMPORTS)} EFFECT.`,
    );

  let taskCount: number;
  let csv = "";
  let constantData = "";

  if (type === "csv") {
    csv = String(body.csv ?? "");
    if (!csv.trim())
      return fail(400, "invalid_request", "'csv' is required for csv jobs.");

    let rows: Record<string, unknown>[];
    try {
      rows = await parseCsv(csv);
    } catch {
      return fail(400, "invalid_request", "Could not parse CSV.");
    }
    if (rows.length === 0)
      return fail(400, "invalid_request", "CSV has no data rows.");

    const headers = Object.keys(rows[0]);
    const missing = missingTemplateFields(template.data, headers);
    if (missing.length)
      return fail(
        400,
        "invalid_request",
        `CSV is missing columns for template fields: ${missing.join(", ")}`,
      );

    const reserved = headers.filter(
      (header) => header === "dataffect/reward" || header.startsWith("__effect"),
    );
    if (reserved.length)
      return fail(
        400,
        "invalid_request",
        `Reserved column(s) not allowed in CSV: ${reserved.join(", ")}.`,
      );
    taskCount = rows.length;
  } else if (type === "constant") {
    const maxTasks = Number(body.maxTasks);
    if (!Number.isInteger(maxTasks) || maxTasks <= 0)
      return fail(
        400,
        "invalid_request",
        "'maxTasks' (positive integer) is required for constant jobs.",
      );

    let parsedData: unknown;
    if (typeof body.data === "string") {
      try {
        parsedData = JSON.parse(body.data);
      } catch {
        return fail(400, "invalid_request", "'data' must be a JSON object.");
      }
    } else {
      parsedData = body.data ?? {};
    }
    if (
      parsedData === null ||
      typeof parsedData !== "object" ||
      Array.isArray(parsedData)
    )
      return fail(400, "invalid_request", "'data' must be a JSON object.");

    const missingFields = missingTemplateFields(
      template.data,
      Object.keys(parsedData),
    );
    if (missingFields.length)
      return fail(
        400,
        "invalid_request",
        `'data' is missing values for template fields: ${missingFields.join(", ")}`,
      );

    const reservedKeys = Object.keys(parsedData).filter(
      (key) => key === "dataffect/reward" || key.startsWith("__effect"),
    );
    if (reservedKeys.length)
      return fail(
        400,
        "invalid_request",
        `Reserved key(s) not allowed in data: ${reservedKeys.join(", ")}.`,
      );

    constantData = JSON.stringify(parsedData);
    taskCount = maxTasks;
  } else {
    return fail(400, "invalid_request", "'type' must be 'csv' or 'constant'.");
  }

  if (taskCount > MAX_TASKS_PER_JOB)
    return fail(
      400,
      "invalid_request",
      `Too many tasks (${taskCount}); max ${MAX_TASKS_PER_JOB} per job.`,
    );

  const cost = rewardLamports * BigInt(taskCount);
  if (cost > MAX_JOB_COST_LAMPORTS)
    return fail(
      400,
      "invalid_request",
      `Job cost ${lamportsToEffect(cost)} EFFECT exceeds the per-job limit of ${lamportsToEffect(MAX_JOB_COST_LAMPORTS)} EFFECT.`,
    );

  return {
    ok: true,
    type,
    name,
    templateId,
    capability,
    timeLimitSeconds,
    uniqueWorker,
    rewardLamports,
    taskCount,
    cost,
    csv,
    constantData,
  };
};

type CachedJobResponse = { status: number; body: unknown };

type TaskCounts = {
  queued: number;
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
};

const countsFor = async (job: Job): Promise<TaskCounts> => {
  const fetcher = await getFetcher(job.datasetId, job.fetcherIndex);
  return {
    queued: fetcher ? countTasks(fetcher, "queue") : 0,
    active: fetcher ? countTasks(fetcher, "active") : 0,
    completed: fetcher ? countTasks(fetcher, "done") : 0,
    failed: fetcher ? countTasks(fetcher, "failed") : 0,
    cancelled: fetcher ? countTasks(fetcher, "cancelled") : 0,
  };
};

export const computeJobCredits = (job: Job, completedCount: number) => {
  const reward = BigInt(job.rewardLamports);
  const reserved = BigInt(job.reservedLamports);
  const consumed = reward * BigInt(completedCount);
  const refunded = BigInt(job.refundedLamports);
  const remaining = reserved - consumed - refunded;
  return {
    reserved,
    consumed,
    refunded,
    remaining: remaining < 0n ? 0n : remaining,
  };
};

const jobView = (job: Job, counts: TaskCounts) => {
  const credits = computeJobCredits(job, counts.completed);
  return {
    id: job.id,
    name: job.name,
    type: job.type,
    status: job.status,
    templateId: job.templateId,
    reward: lamportsToEffect(BigInt(job.rewardLamports)),
    taskCount: job.taskCount,
    uniqueWorker: job.uniqueWorker,
    createdAt: job.createdAt,
    tasks: counts,
    credits: {
      currency: "EFFECT",
      reserved: lamportsToEffect(credits.reserved),
      consumed: lamportsToEffect(credits.consumed),
      refunded: lamportsToEffect(credits.refunded),
      remaining: lamportsToEffect(credits.remaining),
    },
  };
};

const csvCell = (value: unknown): string => {
  let cell = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
  return `"${cell.replace(/"/g, '""')}"`;
};

// ------------------------------------------------------------------ routes

export const addJobApiRoutes = (app: Express): void => {
  app.post(
    "/api/v1/jobs/estimate",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const analysis = await analyzeJob(account.id, req.body ?? {});
      if (!analysis.ok)
        return apiError(res, analysis.status, analysis.code, analysis.message);

      const balance = await getBalance(account.id);
      return apiJson(res, {
        type: analysis.type,
        taskCount: analysis.taskCount,
        rewardPerTask: lamportsToEffect(analysis.rewardLamports),
        cost: lamportsToEffect(analysis.cost),
        currency: "EFFECT",
        balance: lamportsToEffect(balance),
        sufficient: balance >= analysis.cost,
      });
    }),
  );

  // Create a job: debit upfront, then build the owned dataset + fetcher and
  // import its tasks. Credits are refunded if creation fails after the debit.

  const performJobCreation = async (
    req: Request,
    res: Response,
    account: Account,
    idempotencyKey?: string,
  ): Promise<unknown> => {
    const analysis = await analyzeJob(account.id, req.body ?? {});
    if (!analysis.ok)
      return apiError(res, analysis.status, analysis.code, analysis.message);

    const jobId = ulid();

    try {
      await debit(account.id, analysis.cost, {
        jobId,
        note: `job ${jobId} (${analysis.taskCount} tasks)`,
      });
    } catch (err) {
      if (err instanceof InsufficientCreditsError)
        return apiError(res, 402, "insufficient_credits", err.message);
      throw err;
    }

    try {
      const datasetId = nextDatasetId();
      const dataset: DatasetRecord = {
        id: datasetId,
        name: analysis.name,
        status: "active",
        hidden: true, // off public dashboards; the fetcher stays worker-visible
        ownerId: account.id,
      };
      await writeDataset(datasetId, dataset);

      const fetcher = await createFetcher(dataset, {
        name: analysis.name,
        type: analysis.type,
        capabilities: analysis.capability,
        engine: "effectai",
        price: analysis.rewardLamports.toString(),
        template: analysis.templateId,
        timeLimitSeconds: analysis.timeLimitSeconds,
        frequency: DEFAULT_FREQUENCY_SECONDS,
        batchSize: DEFAULT_BATCH_SIZE,
        hidden: false,
        // 1 = each worker may complete one task; 0 = no limit.
        repetitions: analysis.uniqueWorker ? 1 : 0,
      });

      if (analysis.uniqueWorker) {
        fetcher.batchId = jobId;
        await writeFetcher(fetcher);
      }

      if (analysis.type === "csv") {
        await importCsvIntoFetcher(fetcher, analysis.csv);
      } else {
        fetcher.constantData = analysis.constantData;
        fetcher.maxTasks = analysis.taskCount;
        fetcher.targetQueueSize = Math.min(
          analysis.taskCount,
          DEFAULT_BATCH_SIZE,
        );
        await writeFetcher(fetcher);
      }

      const job: Job = {
        id: jobId,
        accountId: account.id,
        datasetId,
        fetcherIndex: fetcher.index,
        type: analysis.type,
        name: analysis.name,
        templateId: analysis.templateId,
        rewardLamports: analysis.rewardLamports.toString(),
        taskCount: analysis.taskCount,
        reservedLamports: analysis.cost.toString(),
        consumedLamports: "0",
        refundedLamports: "0",
        status: "active",
        uniqueWorker: analysis.uniqueWorker,
        createdAt: Date.now(),
      };
      await writeJob(job);
      await db.set(["job-by-dataset", datasetId], {
        accountId: account.id,
        jobId,
      });

      const view = jobView(job, {
        queued: analysis.taskCount,
        active: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
      });

      if (idempotencyKey)
        await db.set<CachedJobResponse>(
          ["idempotency", account.id, idempotencyKey],
          { status: 201, body: view },
        );

      return apiJson(res, view, 201);
    } catch (err) {
      console.error("Job creation failed, refunding:", err);
      await refund(account.id, analysis.cost, {
        jobId,
        note: `job ${jobId} creation failed`,
      });
      return apiError(
        res,
        500,
        "internal",
        "Failed to create job; credits were refunded.",
      );
    }
  };

  app.post(
    "/api/v1/jobs",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;

      const idempotencyKey = req.get("Idempotency-Key")?.trim() || undefined;
      if (!idempotencyKey) return performJobCreation(req, res, account);

      if (idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH)
        return apiError(
          res,
          400,
          "invalid_request",
          `'Idempotency-Key' must be ${MAX_IDEMPOTENCY_KEY_LENGTH} characters or fewer.`,
        );

      return withLock(`idem:${account.id}:${idempotencyKey}`, async () => {
        const cached = await db.get<CachedJobResponse>([
          "idempotency",
          account.id,
          idempotencyKey,
        ]);
        if (cached) return apiJson(res, cached.data.body, cached.data.status);
        return performJobCreation(req, res, account, idempotencyKey);
      });
    }),
  );

  app.get(
    "/api/v1/jobs",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const { limit, offset } = parsePagination(req.query);
      const jobs = (await listJobs(account.id)).sort(
        (first, second) => second.createdAt - first.createdAt,
      );
      const views = await Promise.all(
        jobs
          .slice(offset, offset + limit)
          .map(async (job) => jobView(job, await countsFor(job))),
      );
      return apiJson(res, { jobs: views, total: jobs.length, limit, offset });
    }),
  );

  app.get(
    "/api/v1/jobs/:id",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const job = await getJob(account.id, req.params.id);
      if (!job) return apiError(res, 404, "not_found", "Job not found.");
      return apiJson(res, jobView(job, await countsFor(job)));
    }),
  );

  app.get(
    "/api/v1/jobs/:id/results",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const job = await getJob(account.id, req.params.id);
      if (!job) return apiError(res, 404, "not_found", "Job not found.");

      const { limit, offset } = parsePagination(req.query);

      const doneKeys = (
        await db.listAll<boolean>(
          ["fetcher", job.datasetId, job.fetcherIndex, "done", {}],
          offset + limit,
          true,
        )
      ).slice(offset);

      const results = await Promise.all(
        doneKeys.map(async (entry) => {
          const taskId = entry.key[4] as string;
          const resultRecord = await db.get<{
            timestamp: number;
            result: string;
            submissionByPeer: string;
          }>(["task-result", taskId]);
          const taskRecord = await db.get<Task>(["task", taskId]);

          let input: unknown = {};
          try {
            if (taskRecord?.data?.templateData)
              input = JSON.parse(taskRecord.data.templateData);
          } catch {
            // leave input as {}
          }
          // hide the poster-injected trust flag from the requestor's results
          if (input && typeof input === "object")
            delete (input as Record<string, unknown>).__effectApproved;

          return {
            taskId,
            submittedAt: resultRecord?.data?.timestamp,
            worker: resultRecord?.data?.submissionByPeer,
            input,
            result: resultRecord?.data?.result,
          };
        }),
      );

      if (req.query.format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="job-${job.id}-results.csv"`,
        );
        res.write("taskId,submittedAt,worker,input,result\n");
        for (const row of results) {
          res.write(
            [
              csvCell(row.taskId),
              csvCell(row.submittedAt),
              csvCell(row.worker),
              csvCell(JSON.stringify(row.input)),
              csvCell(row.result),
            ].join(",") + "\n",
          );
        }
        return res.end();
      }

      return apiJson(res, {
        jobId: job.id,
        count: results.length, // rows in this page
        total: db.count(["fetcher", job.datasetId, job.fetcherIndex, "done", {}]), // all completed results
        limit,
        offset,
        results,
      });
    }),
  );

  // Cancel: stop posting queued tasks and drain the in-flight ones. Tasks
  // never posted are refunded here; tasks already at the manager settle one
  // by one via processResults
  app.post(
    "/api/v1/jobs/:id/cancel",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const existing = await getJob(account.id, req.params.id);
      if (!existing) return apiError(res, 404, "not_found", "Job not found.");

      const job = await withLock(existing.id, async (): Promise<Job | null> => {
        const fresh = await getJob(account.id, req.params.id);
        if (!fresh || fresh.status === "cancelled") return fresh;

        const fetcher = await getFetcher(fresh.datasetId, fresh.fetcherIndex);
        if (fetcher) {
          fetcher.status = "draining";
          await writeFetcher(fetcher);

          const queued = await db.listAll<boolean>([
            "fetcher", fresh.datasetId, fresh.fetcherIndex, "queue", {},
          ]);
          for (const entry of queued) {
            const taskId = entry.key[4] as string;
            db.beginTransaction();
            await db.delete([
              "fetcher", fresh.datasetId, fresh.fetcherIndex, "queue", taskId,
            ]);
            await db.set<boolean>(
              ["fetcher", fresh.datasetId, fresh.fetcherIndex, "cancelled", taskId],
              true,
            );
            await db.endTransaction();
          }
        } else {
          const dataset = await getDataset(fresh.datasetId);
          if (dataset) {
            dataset.data.status = "archived";
            await writeDataset(fresh.datasetId, dataset.data);
          }
        }
        fresh.status = "cancelled";

        // Refund everything except completed and in-flight tasks; in-flight
        // credits stay reserved until each task resolves.
        const counts = await countsFor(fresh);
        const { consumed, remaining } = computeJobCredits(fresh, counts.completed);
        const inFlight = BigInt(fresh.rewardLamports) * BigInt(counts.active);
        const refundNow = remaining - inFlight;
        if (refundNow > 0n) {
          await refund(account.id, refundNow, {
            jobId: fresh.id,
            note: `job ${fresh.id} cancelled - ${counts.active} tasks still in flight`,
          });
          fresh.consumedLamports = consumed.toString();
          fresh.refundedLamports = (
            BigInt(fresh.refundedLamports) + refundNow
          ).toString();
        }
        await writeJob(fresh);
        return fresh;
      });

      if (!job) return apiError(res, 404, "not_found", "Job not found.");
      return apiJson(res, jobView(job, await countsFor(job)));
    }),
  );
};
