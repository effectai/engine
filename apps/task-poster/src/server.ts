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
    const datasets = await getActiveDatasets("active");

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

  // gracefull error when files are too lar1ge
  app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
    if ((err as any).status === 413) {
      // TODO: use htmx-ext-response-targets for a 413
      res.setHeader("HX-Retarget", "#messages");
      res.status(200).send(`
<div id="messages">
  <p><blockquote>
    The data is too large. Try submitting less data.
  </blockquote></p>
</div>`);
      next(err);
    }
  });

  // only add livereload when the flag is provided on dev
  const liveReloadEnabled = process.argv.includes("--livereload");
  if (liveReloadEnabled) await addLiveReload(app);

  console.log("Registering module routes");
  addApiRoutes(app);
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
