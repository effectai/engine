import type { KVTransactionResult, KVKey } from "@cross/kv";
import type { Template } from "@effectai/protobufs";
import type { Express } from "express";
import { requireAuth } from "./auth.js";
import * as fetcher from "./fetcher.js";
import type { Fetcher } from "./fetcher.js";
import {
  getFetcher,
  getFetchers,
  getTasks,
  importTasks,
} from "./fetcher.js";
import { isHtmx, make404, make500, page } from "./html.js";
import { db, managerId, publishProgress } from "./state.js";
import { getTemplate, getTemplates, renderTemplate } from "./templates.js";

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
  activeFetcher: number;
  name: string;
  endpoint?: string;
  price: number;
  frequency: number;
  batchSize: number;
  template: string;
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
<form id="main-form" hx-post="/d/create" hx-swap="outerHTML show:window:top">
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

    <sqection>
      <label for="template"><strong>Template</strong><br/><small>This template will be used ` +
  `for each task that gets posted in this dataset.</small></label>
      <select name="template" id="template">
	${(await getTemplates("active")).map(
    (t) =>
      `<option value="${t.data.templateId}"` +
      `${values.template == t.data.templateId ? " selected" : ""}>` +
      `${t.data.name} (${t.data.templateId})</option>`,
  )}
      </select>
    </section>

    <section class="columns gap">
      <div class="column">
	<label for="frequency"><strong>Batch frequency</strong><br/>
<small>How frequent new data is fetched and posted.</small></label>
	<input
	  placeholder="Seconds"
	  type="number"
	  id="frequency" ${addVal(values, "frequency")}
	  name="frequency"/>
      </div>

      <div class="column">
	<label for="batchSize"><strong>Batch size</strong><br/>
<small>How many items to process each batch.</small></label>
	<input
	  placeholder="Amount"
	  type="number"
	  id="batchSize" ${addVal(values, "batchSize")}
	  name="batchSize"/>
      </div>
    </section>

    <section>
      <label for="price"><strong>Price per task</strong></label>
      <input
	placeholder="$EFFECT"
	type="number"
	id="price"  ${addVal(values, "price")}
	name="price"/>
    </section>

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

  endpoint: (v: string) =>
    v &&
    v.length > 0 &&
    !v.startsWith("http") &&
    "Endpoint must start with http",

  frequency: (v: any) => {
    const num = Number(v);
    return (
      (!v && "Frequency is required") ||
      (isNaN(num) && "Must be a number") ||
      (num <= 0 && "Must be greater than 0")
    );
  },

  batchSize: (v: any) => {
    const num = Number(v);
    return !v
      ? "Batch size is required"
      : isNaN(num)
        ? "Must be a number"
        : num <= 0 && "Must be greater than 0";
  },

  price: (v: any) => {
    const num = Number(v);
    return !v
      ? "Price is required"
      : isNaN(num)
        ? "Must be a number"
        : num <= 0 && "Price must be greater than 0";
  },

  template: (v: string) => (!v || v.length === 0) && "Template is required",
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
<div>
<h3>Dataset ${id}</h3>
<p>Status: ${ds.status}</p>
<section>
  <h3>Steps</h3>
  <div class="boxbox">
  ${fetchers.sort((f1, f2) => f1.index - f2.index).map((f: Fetcher) => `
    <div class="box">
      <strong><a href="/d/${id}/f/${f.index}">#${f.index} ${f.name}</a></strong>
      <small>${f.type} (${f.type == "constant" ? f.maxTasks : f.totalTasks})</small>
      <br/>
      <small>queue: ${fetcher.countTasks(f, "queue")} -
             active: ${fetcher.countTasks(f, "active")} -
             done: ${fetcher.countTasks(f, "done")}</small>

    </div>
  `).join('')}
  </div>
  <section>
    <a href="${id}/create-fetcher?type=csv"><button>+ Add Step</button></a>
  </section>
</section>
<section>
<h3>Template example</h3>
<div id="bar">
<iframe
  height="450px"
  width="100%"
  srcdoc="${escapeHTML(values.renderedTemplate)}"></iframe>
</div>
</section>
<form hx-post="/d/${id}" hx-swap="outerHTML">
<section>
${
  ds.status === "draft"
    ? `<button hx-post="/d/${id}?action=publish">Publish</button>`
    : ds.status === "active"
      ? `<button hx-post="/d/${id}?action=archive">Archive</button>`
      : `Status: ${ds.status}`
}
</div>
</form>
</section>
${ds.status == "active" ? `<section><h3>Add more data<h3></section>` : ``}
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
      const fetchers = await getFetchers(ds);
      for (const f of fetchers) {
	imported += await fetcher.processFetcher(f);
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

  app.get("/d/:id/progress", async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await db.get<DatasetRecord>(["dataset", id]);
    if (!dataset) return make404(res);

    // res.send(await importProgress(dataset!.data));
  });

  app.get("/d/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await db.get<DatasetRecord>(["dataset", id]);

    if (!dataset) return make404(res);

    const fetchers = await getFetchers(dataset.data);

    let renderedTemplate;
    try {
      // fetcher = await getFetcher(dataset!.data);
      const tpl = await getTemplate(dataset!.data.template);

      renderedTemplate = await renderTemplate(
        tpl!.data.data,
	{}
      );
    } catch (e) {
      res.status(500);
      console.log(`Error parsing task template ${e}`);
      res.send(page("<h1>Error while parsing task template"));
      return;
    }

    res.send(
      page(`
<div id="page">
        ${await confirmForm(
	  id,
	  dataset.data!,
	  { ...dataset.data, renderedTemplate },
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
      if (dataset!.data.status !== "draft") return make500(res);

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
    }
  });
};
