import type { Express, Request, Response, NextFunction } from 'express';
import express from "express";
import { addAuthRoutes, hasAuth } from "./auth.js";
import { addFetcherRoutes, getFetchers, countTasks } from "./fetcher.js";
import {
  addDatasetRoutes,
  getActiveDatasets,
  startAutoImport,
} from "./dataset.js";
import type { DatasetRecord } from "./dataset.js";
import * as dataset from "./dataset.js";
import { page } from "./html.js";
import { addLiveReload } from "./livereload.js";
import * as state from "./state.js";
import {
  addTemplateRoutes,
} from "./templates.js";
import { addRequestorApiRoutes } from "./api/api.js";
import { addAdminRoutes } from "./api/admin.js";
import { addJobApiRoutes } from "./api/jobs.js";
import { rateLimitApi } from "./api/accounts.js";
import { apiError, apiNotFound } from "./api/api-util.js";

const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });

const campaignCard = (d: DatasetRecord) => {
  // const dots = Array(25).fill(".").map((_) => '<div class="block"></div>').join("");
  //`<div class="blocks blockz mt">${dots}</div>r
  return (
    `
<a class="box" href="/d/${d.id}">
  <img src="${ d.image || "https://effect.ai/img/hero-background.png" }"/>
  <div class="content">
  <strong>${d.name}</strong><br/>
  <small class="ne-line">${d.description || "..."}</small>
</div>
</a>`

  );
};

const addApiRoutes = (app: Express) => {
  // CORS handler for API routes
  const setCorsHeaders = (res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  };

  app.options("/api/stats", (_req: Request, res: Response) => {
    setCorsHeaders(res);
    res.status(204).end();
  });

  app.get("/api/stats", async (_req: Request, res: Response) => {
    setCorsHeaders(res);
    const activeDatasets = await getActiveDatasets("active");

    let totalQueue = 0;
    let totalActive = 0;
    let totalDone = 0;

    const datasets = [];

    for (const ds of activeDatasets) {
      // Skip hidden datasets (For private/secret datasets)
      if (ds.hidden) continue;

      const fetchers = await getFetchers(ds.id);
      let dsQueued = 0;
      let dsActive = 0;
      let dsCompleted = 0;
      let timeLimitSeconds = 0;

      const steps = [];

      for (const f of fetchers) {
        const stepQueued = countTasks(f, "queue");
        const stepActive = countTasks(f, "active");
        const stepCompleted = countTasks(f, "done");

        dsQueued += stepQueued;
        dsActive += stepActive;
        dsCompleted += stepCompleted;

        if (f.timeLimitSeconds > timeLimitSeconds) {
          timeLimitSeconds = f.timeLimitSeconds;
        }

        // Only include non-hidden steps in the response
        if (!f.hidden) {
          steps.push({
            index: f.index,
            name: f.name,
            type: f.type,
            capabilities: f.capabilities || [],
            tasksQueued: stepQueued,
            tasksActive: stepActive,
            tasksCompleted: stepCompleted,
            timeLimitSeconds: f.timeLimitSeconds,
          });
        }
      }

      totalQueue += dsQueued;
      totalActive += dsActive;
      totalDone += dsCompleted;

      datasets.push({
        id: ds.id,
        name: ds.name,
        tasksQueued: dsQueued,
        tasksActive: dsActive,
        tasksCompleted: dsCompleted,
        timeLimitSeconds,
        steps: steps.sort((a, b) => a.index - b.index),
      });
    }

    res.json({
      activeDatasets: datasets.length,
      tasksQueued: totalQueue,
      tasksActive: totalActive,
      tasksCompleted: totalDone,
      datasets,
    });
  });
};

const addMainRoutes = (app: Express) => {
  app.get("/", async (req: Request, res: Response) => {
    // hidden datasets (incl. Requestor-API jobs) stay off the public homepage
    const datasets = (await getActiveDatasets("active")).filter((d) => !d.hidden);

    const dsList = datasets.map((d) => campaignCard(d));

    const oldDs = (await getActiveDatasets("finished"))
      .concat(await getActiveDatasets("archived"))
      .map(
	(d) => `
<a href="/d/${d.id}">${d.name}</a> <small>${d.id}</small>`,
      );

    res.send(
      page(
	`
  <h2>Browse Datasets</h2>
  <div class="boxbox">
  ${
    dsList.length
      ? `${dsList.join('')}`
      : ""
  }
  </div>

<div class="mt button-bar">
  <a href="/d/create"><button>+ New Dataset</button></a>
  ${hasAuth(req) ? `<a href="/d/archived"><button>> Archived Datasets</button></a>` : "" }
</div>
`,
      ),
    );
  });
};

const main = async () => {
  const dbFile = process.env.DB_FILE || "mydatabase.db";
  const port = Number.parseInt(process.env.PORT || "3001");

  console.log(`Opening database at ${dbFile}`);
  await state.db.open(dbFile);

  console.log(`Syncing database state`);
  await dataset.initialize();

  console.log("Initializing HTTP server");
  const app = express();
  app.disable("x-powered-by");
  app.use(express.static("public"));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));
  app.use(express.json({ limit: "20mb" }));

  // Body-parser errors (bad JSON, oversized body, ...) land here. API routes
  // get the JSON error envelope; the HTMX UI keeps its inline 413 message.
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    const status = (err as { status?: number }).status ?? 500;
    if (res.headersSent) return next(err);

    if (req.path.startsWith("/api/")) {
      if (status === 413)
        return apiError(
          res,
          413,
          "invalid_request",
          "Request body too large (max 20 MB).",
        );
      if (status >= 400 && status < 500)
        return apiError(res, status, "invalid_request", "Malformed request body.");
      console.error("Unhandled API error:", err);
      return apiError(res, 500, "internal", "Internal server error");
    }

    if (status === 413) {
      // 200 on purpose: plain htmx only swaps 2xx responses, and the legacy
      // upload UI relies on this fragment showing up inline.
      // TODO: use htmx-ext-response-targets for a real 413
      res.setHeader("HX-Retarget", "#messages");
      return res.status(200).send(`
<div id="messages">
  <p><blockquote>
    The data is too large. Try submitting less data.
  </blockquote></p>
</div>`);
    }
    next(err);
  });

  // only add livereload when the flag is provided on dev
  const liveReloadEnabled = process.argv.includes("--livereload");
  if (liveReloadEnabled) await addLiveReload(app);

  console.log("Registering module routes");
  addApiRoutes(app);
  app.use("/api/v1", rateLimitApi); // per-key rate limit for the Requestor API
  addRequestorApiRoutes(app);
  addJobApiRoutes(app);
  app.use("/api/v1", apiNotFound); // JSON 404 for unmatched /api/v1/* routes
  addAdminRoutes(app);
  addMainRoutes(app);
  addTemplateRoutes(app);
  addDatasetRoutes(app);
  addAuthRoutes(app);
  addFetcherRoutes(app);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  await startAutoImport();
};

await main();
