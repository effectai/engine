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
import * as dataset from "./dataset.js";
import * as fetcher from "./fetcher.js";

const addMainRoutes = (app: Express) => {
  // TODO: this screen on longer works, move it to settings
  app.get("/select-manager", async (req, res) => {
    res.send(
      page(`
<p>Select a manager:</p>
<form action="/m" method="post" hx-post="/m">
  <select name="manager" style="width: 100%;">
    <option value="${state.managerId}">
      /ip4/127.0.0.1/tcp/11995/ws/p2p/12D3K..f9cPb
    </option>
  </select>

  <button style="display: block; margin-left: auto; margin-top: 25px">Continue</button>
</form>
`),
    );
  });

  app.post("/m", (req, res) => {
    const dst = `/m/${req.body.manager}`;
    if (isHtmx(req)) {
      res.setHeader("HX-Redirect", dst);
      res.end();
    } else {
      res.redirect(dst);
    }
  });

  app.get("/", async (req, res) => {
    const templates = await getTemplates();
    const tmpList = templates.map(
      (t) => `
<a class="box" href="/t/test/${t.data.templateId}">
  ${t.data.name || "[no name]"} (${t.data.createdAt})
</a>`,
    );

    const datasets = await getActiveDatasets("active");
    const dsList = datasets.map(
      (d) => `<a href="/d/${d!.data.id}">${d!.data.name} (${d!.data.id})</a>`,
    );

    const oldDs = (await getActiveDatasets("finished")).map(
      (d) => `<a href="/d/${d!.data.id}">${d!.data.name} (${d!.data.id})</a>`,
    );

    res.send(
      page(`
<small>Manager: ${state.managerId}</small>

<h3>Known Templates (${tmpList.length})</h3>
${tmpList.length ? `<div class="boxbox">${tmpList.join("")}</div>` : ""}
<a href="/t/create"><button>+ Create Template</button></a>

<section>
  <h3>Active Datasets (${dsList.length})</h3>
  ${
    dsList.length	
      ? `
  <ul><li>${dsList.join("</li><li>")}</li></ul>`
      : ""
  }
  <a href="/d/create"><button>+ Create Dataset</button></a>
</section>

<section>
  <h3>Finished Datasets</h3>
  <ul><li>${oldDs.reverse().join("</li><li>")}</li></ul>
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

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  await startAutoImport();
};

await main();
