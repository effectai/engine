import type { KVTransactionResult, KVKey } from "@cross/kv";
import type { Template } from "@effectai/protobufs";
import type { Express } from "express";
import { requireAuth } from "./auth.js";
import * as fetcher from "./fetcher.js";
import type { Fetcher } from "./fetcher.js";
import { isHtmx, make404, make500, page } from "./html.js";
import { db, managerId, publishProgress } from "./state.js";
import { getTemplate, getTemplates, renderTemplate } from "./templates.js";
import { generateDag } from "./dag.js";

type DatasetStatus = "active" | "draft" | "finished" | "archived";
const statusValues: DatasetStatus[] = [
  "active",
  "draft",
  "finished",
  "archived",
];

export const datasetIndex = {
  byStatus: {} as Record<DatasetStatus, Set<number>>,
};
statusValues.forEach((s) => (datasetIndex.byStatus[s] = new Set<number>()));

type FormValues = Record<string, any>;

export type DatasetRecord = {
  id: number;
  status: DatasetStatus;
  name: string;
  image?: string;
  description?: string;
  hidden?: boolean;
};

export const getDataset = async (id: number) =>
  db.get<DatasetRecord>(["dataset", id, "info"]);

export const getDatasets = async () =>
  await db.listAll<DatasetRecord>(["dataset", {}, "info"]);

export const getActiveDatasets = async (s: DatasetStatus) => {
  const p = Array.from(datasetIndex.byStatus[s]).map((id) =>
    db.get<DatasetRecord>(["dataset", id, "info"]).then(a => a!.data),
  );

  return Promise.all(p);
};

export const writeDataset = async(id: number, ds: DatasetRecord) => 
  await db.set<DatasetRecord>(["dataset", id, "info"], ds);

export const initialize = async () => {
  // build indexes
  (await getDatasets()).forEach((ds) =>
    datasetIndex.byStatus[ds.data.status].add(ds.data.id),
  );

  // keep index up to date
  db.watch(["dataset", {}, "info"], (data: KVTransactionResult<DatasetRecord>) => {
    const id = data.data.id;

    statusValues.forEach((v: DatasetStatus) =>
      datasetIndex.byStatus[v] ? datasetIndex.byStatus[v].delete(id) : null,
    );
    datasetIndex.byStatus[data.data.status].add(id);
  });

  db.watch(["fetcher", {}, {}, "info"], (data: KVTransactionResult<Fetcher>) => {
    console.log(`Trace: saved fetcher ${data.key}`);
  });
};

// little shorthand to inject form field's value if it exists
const addVal = (values: FormValues, key: string): string =>
  `${values[key] ? `value="${values[key]}"` : ""}`;

const form = async (msg = "", values: FormValues = {}): Promise<string> =>
  `
<form id="main-form" hx-post="${values.id ? "/d/" + values.id  : "/d/create"}" hx-swap="outerHTML show:window:top">
  <div id="messages">
    ${msg ? `<p id="messages"><blockquote>${msg}</blockquote></p>` : ""}
  </div>
  <fieldset>
    <label for="name"><strong>Name</strong></label>
    <input
      placeholder="Dataset name"
      type="text"
      id="name"  ${addVal(values, "name")}
      name="name"/>

    <label for="description"><strong>Description</strong></label>
    <textarea id="description" name="description" rows="8">` +
  `${values.description || ""}</textarea>

    <label for="name"><strong>Image</strong></label>
    <input
      placeholder="URL"
      type="text"
      id="image"  ${addVal(values, "image")}
      name="image"/>

    <fieldset>
      <legend>Visibility</legend>
      <label>
        <input type="checkbox" id="hidden" name="hidden" ${values.hidden ? "checked" : ""} />
        <strong>Hide from workers</strong>
        <br/><small>When enabled, this dataset will not be visible to workers on the frontend.</small>
      </label>
    </fieldset>

    <section>
      <button type="submit">Continue</button>
    </section>
  </fieldset>
</form>
`;

type ValidationFunction = (v: any) => string | boolean | undefined | null;
type ValidationMap = Record<string, ValidationFunction>;

// validation functions return string on error or falsey on success
const validations: ValidationMap = {
  name: (v: string) => (!v || v.length === 0) && "Name is required",
};

const validateForm = async (values: FormValues) => {
  const errors: Record<string, string> = {};

  Object.keys(validations).forEach((field) => {
    const error = validations[field](values[field]);
    if (error) errors[field] = error as string;
  });

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
};

const escapeHTML = (html: string): string =>
  html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const confirmForm = async (
  id: number,
  ds: DatasetRecord,
  values: FormValues = {},
  fetchers: Fetcher[] = [],
): Promise<string> => `
<div class="container">
<div style="display: flex; justify-content: space-between; align-items: center;">
  <h3>${ds.name}</h3>
  <nav style="display: flex; gap: 1.0rem;">
    <a href="/d/${id}/stats"><button>Stats</button></a>
    <a href="/d/${id}/edit"><button>Edit</button></a>
    <button class="download">Download</button>
  </nav>
</div>
${ds.image ? 
  `<img style="border: 1px solid var(--border); border-radius: 15px; object-fit: cover; overflow: hidden;" height="150px" width="100%" src="${ds.image}"/>` : '' }
<p>${ds.description || "" }</p>
<section>
  <h3>Steps</h3>
  ${generateDag(fetchers)}
    ${fetchers.sort((f1, f2) => f1.index - f2.index).map((f: Fetcher) => `
  `).join('')}
  <div class="mt" style="display: flex; justify-content: center;">
    <a href="${id}/create-fetcher?type=csv">
      <button>+ Add Step</button>
    </a>
   </div>
</section>
<form hx-post="/d/${id}" hx-swap="outerHTML">
<section>
${
  ds.status === "draft"
    ? `<button hx-post="/d/${id}?action=publish">Publish</button>`
    : ds.status === "active"
    ? `<button  hx-confirm="Are you sure you wish to arhive this?"
                hx-post="/d/${id}?action=archive">Archive Dataset</button>`
      : `<button hx-post="/d/${id}?action=publish">Publish</button>`
}
</div>
</form>
</section>
<section></section>
`;

// starts auto-importing of active datasets
export const startAutoImport = async () => {
  while (true) {
    const activeDatasets = await getActiveDatasets("active");
    console.log(`Checking all ${activeDatasets.length} active datasets`);

    // import tasks for every active campaign
    // TODO: weirdest KV db bug when making this async as below (some fetchers
    // stop getting saved). spent hours debugging that. I believe we need to
    // move to an other KV store.
    // to make it async, use:
    // await Promise.all(activeDatasets.map(async (ds) => {
    for (const ds of activeDatasets) {
      let imported = 0;
      const fetchers = await fetcher.getFetchers(ds.id);
      for (const f of fetchers) {
	imported += await fetcher.processFetcher(f!);
      }

      // TODO: finish dataset when all fetchers are finished
      // const dsId = ["dataset", ds.id];
      // if (!imported || imported === 0) {
      //   console.log(`Dataset ${dsId} finished`);
      //   ds.status = "finished";
      //   await db.set<DatasetRecord>(dsId, ds);
      // }
    }

    // pause on the main loop
    await new Promise((r) => setTimeout(r, 10000));
  }
};

export const addDatasetRoutes = (app: Express): void => {
  app.get("/d/archived", requireAuth, async (_req, res) => {
    const ds = await getActiveDatasets("archived");
    res.send(page(ds.map(d => `<a href="/d/${d.id}">${d.name}</a>`).join("")) );
  });

  app.get("/d/create", requireAuth, async (_req, res) => {
    res.send(page(await form()));
  });

  app.post("/d/create", requireAuth, async (req, res) => {
    let { valid, errors } = await validateForm(req.body);
    let msg = Object.values(errors).join("<br/>- ");
    msg = msg ? "- " + msg : "";
    let id;

    if (valid) {
      try {
        // use time in nanoseconds as incremental dataset ID (not perfect)
        id = Number(process.hrtime.bigint());

        const datasetFields = req.body;
        const dataset: DatasetRecord = {
          ...datasetFields,
          id,
          activeFetcher: 0,
          status: "draft",
          hidden: datasetFields.hidden === "on" || datasetFields.hidden === true,
        };

        await writeDataset(id, dataset);

        console.log(`Created dataset ${id}`);
        msg = `<p>Success! Dataset ${id}</p>`;
      } catch (e) {
        msg = '<h4 style="margin-top: 0;">Error creating dataset:</h4>';
        valid = false;
        console.log(e);
      }
    } else {
      msg = '<h4 style="margin-top: 0;">Could not create dataset:</h4>' + msg;
    }

    if (valid) {
      res.setHeader("HX-Location", `/d/${id}`);
      res.end();
    } else {
      console.log(`Invalid form submission ${msg}`);
      res.send(await form(msg, req.body));
    }
  });

  app.get("/d/:id/edit", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await db.get<DatasetRecord>(["dataset", id]);

    if (!dataset) return make404(res);
    res.send(page(await form("", dataset?.data)));
  });

  app.get("/d/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await db.get<DatasetRecord>(["dataset", id]);

    if (!dataset) return make404(res);

    const fetchers = await fetcher.getFetchers(dataset.data.id);

    res.send(
      page(`
<div id="page">
        ${await confirmForm(
	  id,
	  dataset.data!,
	  { ...dataset.data },
	  fetchers
	)}
`),
    );
  });

  app.post("/d/:id", requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await getDataset(id);

    if (!dataset) return make404(res);

    if (req.query.action == "publish") {
      if (dataset!.data.status !== "draft" && dataset!.data.status !== "archived")
	return make500(res);

      // activate the dataset
      dataset!.data.status = "active";
      await db.set<DatasetRecord>(dataset!.key, dataset!.data);

      // finish the HTTP request
      res.setHeader("HX-Location", `/d/${id}`);
      res.end();
    } else if (req.query.action === "archive") {
      if (dataset!.data.status !== "active") return make500(res);
      console.log(`Trace: archiving dataset ${id}`);

      dataset!.data.status = "archived";
      await db.set<DatasetRecord>(dataset!.key, dataset!.data);

      const msg = "Successfully archived dataset";
      res.send(`
      <div id="page" hx-swap-oob="true">
        <blockquote>${msg}</blockquote>
        <p><a href="/"><button>Home</button></a></p>
      </div>
      `);
    } else {
      // this is the EDIT action
      let { valid, errors } = await validateForm(req.body);
      let msg = Object.values(errors).join("<br/>- ");
      msg = msg ? "- " + msg : "";
      let id;

      if (valid) {
	dataset!.data.name = req.body.name;
	dataset!.data.image = req.body.image;
	dataset!.data.description = req.body.description;
	dataset!.data.hidden = req.body.hidden === "on" || req.body.hidden === true;
	await db.set<DatasetRecord>(dataset!.key, dataset!.data);
        msg = `<p>Success! Dataset ${id}</p>`;
      } else {
	msg = '<h4 style="margin-top: 0;">Could not create dataset:</h4>' + msg;
      }

      if (valid) {
	res.setHeader("HX-Location", `/d/${dataset.data.id}`);
	res.end();
      } else {
	console.log(`Invalid form submission ${msg}`);
	res.send(await form(msg, req.body));
      }
    }
  });

};
