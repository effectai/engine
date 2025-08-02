import type { Express } from "express";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addLiveReload } from "./livereload.js";
import { isHtmx, page } from "./html.js";
import * as state from "./state.js";
import {
  addTemplateRoutes,
  type TemplateRecord,
  getTemplates,
} from "./templates.js";
import {
  addDatasetRoutes,
  getDatasets,
  getActiveDatasets,
  datasetIndex,
  startAutoImport,
} from "./dataset.js";
import {
  addAuthRoutes,
} from "./auth.js";
import * as dataset from "./dataset.js";
import * as fetcher from "./fetcher.js";

const addMainRoutes = (app: Express) => {
  app.get("/", async (req, res) => {
    const datasets = await getActiveDatasets("active");
    const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dsList = datasets.map(
      (d) => `<strong><a href="/d/${d!.data.id}">${d!.data.name}</a></strong> <small>Created ${formatDate(d!.data.id)}</small>`,
    );

    const oldDs = (await getActiveDatasets("finished"))
      .concat(await getActiveDatasets("archived"))
      .map((d) => `
<a href="/d/${d!.data.id}">${d!.data.name}</a> <small>${d!.data.id}</small>`,
    );

    res.send(
      page(`
<section>
  <h2>Active Campaigns (${dsList.length})</h2>
  <p>The following datasets are currently being crafted by people and AI around the globe. Powered by Effect AI.</p>

  ${dsList.length ? `<div><div class="box">${dsList.join("</div><div class=\"box\">")}</div></div>` : ""}

<section><a href="/d/create"><button>+ Create Dataset</button></a></section>

  <section>
    <h2>Recent Datasets (${oldDs.length})</h2>
    <ul><li>${oldDs.reverse().join("</li><li>")}</li></ul>
  </section>
</section>
`),
    );
  });
};

const main = async () => {
  const dbFile = process.env.DB_FILE || "mydatabase.db";
  const port = parseInt(process.env.PORT || "3001");

  console.log(`Opening database at ${dbFile}`);
  await state.db.open(dbFile);

  console.log(`Syncing database state`);
  await dataset.initialize();

  console.log("Initializing HTTP server");
  const app = express();
  app.disable('x-powered-by');
  app.use(express.static("public"));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));
  app.use(express.json({ limit: '2mb' }));

  // gracefull error when files are too lar1ge
  app.use((err, req, res, next) => {
    if (err.status === 413) {
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
