import { isHtmx, page, make404, make500 } from "./html.js";
import type { Express } from "express";
import { managerId, db, publishProgress } from "./state.js";
import { parseString } from "@fast-csv/parse";
import { getTemplates, getTemplate, renderTemplate } from "./templates.js";
import { type Template, computeTemplateId } from "@effectai/protocol";
import { KVTransactionResult } from "@cross/kv";
import * as fetcher from "./fetcher.js";
import type { Fetcher } from "./fetcher.js";
import {
  getFetcher,
  importTasks,
  createCsvFetcher,
  getTasks,
} from "./fetcher.js";

type DatasetStatus = "active" | "draft" | "finished" | "archived";
const statusValues: DatasetStatus[] = ["active", "draft", "finished", "archived"];

export const datasetIndex = {
  byStatus: {} as Record<DatasetStatus, Set<number>>,
};
statusValues.forEach(s => datasetIndex.byStatus[s] = new Set<number>());

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

export const getDatasets = async () =>
  await db.listAll<DatasetRecord>(["dataset", {}]);

export const getActiveDatasets = async (s: DatasetStatus) => {
  const p = Array.from(datasetIndex.byStatus[s]).map((id) =>
    db.get<DatasetRecord>(["dataset", id]),
  );
  return Promise.all(p);
};

export const initialize = async () => {
  // build indexes
  (await getDatasets()).forEach((ds) =>
    datasetIndex.byStatus[ds.data.status].add(ds.data.id),
  );

  // keep index up to date
  db.watch(["dataset", {}], (data: KVTransactionResult<DatasetRecord>) => {
    const id = data.data.id;
    statusValues.forEach((v: DatasetStatus) =>
      datasetIndex.byStatus[v] ? datasetIndex.byStatus[v].delete(id) : null,
    );
    datasetIndex.byStatus[data.data.status].add(id);
  });

  db.watch(["fetcher", {}, {}], (data: KVTransactionResult<Fetcher>) => {
    console.log(`Trace: saved fetcher ${data.key}`);
  });
};

// little shorthand to inject form field's value if it exists
const addVal = (values: FormValues, key: string): string =>
  `${values[key] ? `value="${values[key]}"` : ""}`;

const form = async (msg = "", values: FormValues = {}) : Promise<string> => `
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

    <section>
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

      <label for="endpoint"><strong>Endpoint</strong><br/><small>The HTTP endpoint where ` +
  `new data will bet fetched from priodically. Data should be returned as CSV text.</small></label>
      <input
	placeholder="<disabled, coming soon>"
	type="text"
	disabled
	id="name" ${addVal(values, "endpoint")}
	name="endpoint"/>

      <label for="csv"><strong>Initial data</strong><br/>
      <small>Initial CSV dataset to be used for tasks. First row must define ` +
  `the header. You will be able to add more data later.</small></label>
      <textarea placeholder="CSV" id="csv" name="csv" rows="3">` +
  `${values.csv || ""}</textarea>
      <select name="delimiter">
	${[
    [",", "Comma"],
    ["\t", "Tab"],
    [";", "Semicolon"],
  ].map(
    ([v, n]) =>
      `<option ${values.delimiter == v ? "selected " : ""}value="${v}">` +
      `${n} separated</option>`,
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
  delimiter: (v: string) =>
    ![",", "\t", ";"].includes(v) && "Invalid CSV delimiter",
};

const parseCsv = (csv: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const data: any[] = [];

    parseString(csv, { headers: true })
      .on("error", (error) => reject(error))
      .on("data", (row) => data.push(row))
      .on("end", (rowCount: number) => {
        console.log(`Parsed ${rowCount} rows`);
        resolve(data);
      });
  });
};

const validateForm = async (values: FormValues) => {
  const errors: Record<string, string> = {};

  Object.keys(validations).forEach((field) => {
    const error = validations[field](values[field]);
    if (error) errors[field] = error as string;
  });

  // csv check
  if (values.csv && values.csv.length > 0) {
    try {
      const taskData = await parseCsv(values.csv);
      if (taskData.length === 0)
        errors["csv"] = `CSV needs at least 1 data row`;
    } catch (e) {
      errors["csv"] = `CSV ${e}`;
    }
  }

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

const importProgress = async (ds: DatasetRecord) => {
  const dsId = ds.id;

  const fetcher = await getFetcher(ds);

  const currentIdx = publishProgress[dsId]
    ? publishProgress[dsId].current + fetcher.taskIdx
    : fetcher.taskIdx;

  const progressDots = Array(currentIdx)
    .fill(".")
    .map((_) => '<div class="block"></div>')
    .join("");

  const pendingDots = Array(fetcher.totalTasks - currentIdx)
    .fill(".")
    .map((_) => '<div class="block empty"></div>')
    .join("");

  return `
<div hx-get="/d/${dsId}/progress"
  hx-trigger="every 1000 ms"
  hx-target="this"
  hx-swap="outerHTML">
<h3>Data progress</h3>
<span id="pb">${currentIdx}</span> / ${fetcher.totalTasks}
<p id="pb-blocks" class="blocks">${progressDots}${pendingDots}</p>
<p>Last import: ${
    fetcher.lastImport ? new Date(fetcher.lastImport).toLocaleString() : "never"
  }</p>
</div>`;
};

const confirmForm = async (
  id: number,
  ds: DatasetRecord,
  values: FormValues = {},
): Promise<string> => `
<div>
<h3>Dataset ${id}</h3>
<p>Status: ${ds.status}</p>
${await importProgress(ds)}
<h3>Template example</h3>
<div id="bar">
<iframe
  height="450px"
  width="100%"
  srcdoc="${escapeHTML(values.renderedTemplate)}"></iframe>
</div>
<form hx-post="/d/${id}" hx-swap="outerHTML">
<section>
${ds.status === "draft"
    ? `<button hx-post="/d/${id}?action=publish">Publish</button>`
    :  ds.status === "active"
      ? `<button hx-post="/d/${id}?action=archive">Archive</button>`
      : `Status: ${ds.status}`}
</div>
</form>
</section>
<section>
  <h3>Add more data<h3>
</section>
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
      const imported = await fetcher.importTasks(ds!.data);

      if (!imported || imported === 0) {
        console.log(`Dataset ${ds!.data.id} finished`);
        ds!.data.status = "finished";
        await db.set<DatasetRecord>(ds!.key, ds!.data);
      }
    }

    // pause on the main loop
    await new Promise((r) => setTimeout(r, 10000));
  }
};

export const addDatasetRoutes = (app: Express): void => {
  app.get("/d/create", async (_req, res) => {
    res.send(page(await form()));
  });

  app.post("/d/create", async (req, res) => {
    let { valid, errors } = await validateForm(req.body);
    let msg = Object.values(errors).join("<br/>- ");
    msg = msg ? "- " + msg : "";
    let id;

    if (valid) {
      try {
        // use time in nanoseconds as incremental dataset ID (not perfect)
        id = Number(process.hrtime.bigint());

        const { csv, delimiter, ...datasetFields } = req.body;
        const dataset: DatasetRecord = {
          ...datasetFields,
          id,
          activeFetcher: 0,
          status: "draft",
        };

        await db.set<DatasetRecord>(["dataset", id], dataset);
        await createCsvFetcher(dataset, csv, delimiter);

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

    res.send(await importProgress(dataset!.data));
  });

  app.get("/d/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await db.get<DatasetRecord>(["dataset", id]);

    if (!dataset) return make404(res);

    let fetcher, renderedTemplate;
    try {
      fetcher = await getFetcher(dataset!.data);

      const tpl = await getTemplate(dataset!.data.template);
      renderedTemplate = await renderTemplate(tpl!.data.data, fetcher.dataSample);
    } catch (e) {
      res.status(500);
      console.log(`Error parsing task template ${e}`);
      res.send(page("<h1>Error while parsing task template"));
      return;
    }

    res.send(
      page(`
<div id="page">
        ${await confirmForm(id, dataset.data!, {
          ...dataset!.data,
          renderedTemplate,
        })}
`,
      ),
    );
  });

  app.post("/d/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dataset = await db.get<DatasetRecord>(["dataset", id]);

    if (!dataset) return make404(res);

    if (req.query.action == "publish") {
      if (dataset!.data.status !== "draft") return make500(res);

      // activate the dataset
      dataset!.data.status = "active";
      await db.set<DatasetRecord>(dataset!.key, dataset!.data);

      // finish the HTTP request
      res.setHeader("HX-Location", `/d/${id}`);
      res.end();

      // start the fetcher
      await importTasks(dataset!.data);

      // start auto importing from now on
      await fetcher.importTasks(dataset!.data);
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
