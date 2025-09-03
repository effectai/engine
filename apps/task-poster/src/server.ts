import type { Express, Request, Response, NextFunction } from 'express';
import express from "express";
import { addAuthRoutes } from "./auth.js";
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
  //`<div class="blocks blockz mt">${dots}</div>

  return (
    `
<strong><a href="/d/${d.id}">${d.name}</a></strong>` +
    ` <small>Started ${formatDate(d.id)}</small>
<div><small>Tasks: 2.3M - Workers: 17,000 - Completed: 97%</small></div>
`
  );
};

const addMainRoutes = (app: Express) => {
  app.get("/", async (_: Request, res: Response) => {
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
<section>
  <h2>Active Campaigns (${dsList.length})</h2>
  <p>The following datasets are currently being crafted by people and AI around the globe, ` +
	  `brought to you by Effect AI.</p>

  <div class="boxbox">
  ${
    dsList.length
      ? `<div class="box">${dsList.join('</div><div class="box">')}</div>`
      : ""
  }
  </div>

<section><a href="/d/create"><button>+ New Dataset</button></a></section>

  <section>
    <h2>Recent Datasets (${oldDs.length})</h2>
    <ul><li>${oldDs.reverse().join("</li><li>")}</li></ul>
  </section>
</section>
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
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.use(express.json({ limit: "2mb" }));

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
  addMainRoutes(app);
  addTemplateRoutes(app);
  addDatasetRoutes(app);
  addAuthRoutes(app);

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  await startAutoImport();
};

await main();
