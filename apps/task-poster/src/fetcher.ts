import { isHtmx, make404, make500, page } from "./html.js";
import type { Express } from "express";
import type { Task } from "@effectai/protocol";
import { parseString } from "@fast-csv/parse";
import axios from "axios";
import { ulid } from "ulid";
import type { DatasetRecord } from "./dataset.js";
import { db, managerId, publishProgress } from "./state.js";
import * as state from "./state.js";
import { KVKey, KVQuery, KVTransactionResult } from "@cross/kv";
import { getTemplate, getTemplates, renderTemplate } from "./templates.js";

// TODO: can this come out of the protocol package?

type APIResponse = {
  status: string;
  data?: any;
  error?: string;
};

export type Fetcher = {
  lastImport: number | undefined;
  datasetId: number;
  index: number; // the index relative to other fetchers in the dataset
  type: "csv" | "constant";

  name: string;
  price: number;
  frequency: number;
  batchSize: number;
  template: string;

  taskIdx: number; // the last task processed
  totalTasks: number;

  dataSample: any;
  status: "active" | "archived";

  // fields for csv fetchers
  delimiter?: "," | "\t" | ";";
  csvHeader?: string;

  // fields for constant fetchers
  constantData?: string;
  targetQueueSize?: number;
  maxTasks?: number;

  // fields for previous step fetchers
  previousIndex?: number;
};

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  baseURL: state.managerUrl,
});

const parseCsv = (csv: string, delimiter = ","): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const data: any[] = [];

    parseString(csv, { headers: true, delimiter })
      .on("error", (error) => reject(error))
      .on("data", (row) => data.push(row))
      .on("end", (rowCount: number) => {
	console.log(`CSV: Parsed ${rowCount} rows`);
	resolve(data);
      });
  });
};

const formatDate = (ts: number) =>
  new Date(ts * 1000).toLocaleString("en-GB", {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZoneName: 'short',
  }).replace(',', '');

// little shorthand to inject form field's value if it exists
const addVal = (values: FormValues, key: string): string =>
  `${values[key] ? `value="${values[key]}"` : ""}`;
type FormValues = Record<string, any>;

export const csvFetcherForm = async (dsId: number, values: FormValues) => `
<fieldset>
    <legend>csv data</legend>
      <label for="csv"><strong>Data</strong><br/>
      <small>CSV dataset to be used for tasks. First row must define ` +
  `the header.</small></label>
      <textarea placeholder="CSV" id="csv" name="csv" rows="10">` +
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
</fieldset>
`;

export const fetcherForm = async (dsId: number, values: FormValues, msg = "", fid: number | undefined = undefined) => `
<div id="page">
<form hx-post="/d/${dsId}/${fid ? `f/${fid}/edit` : "fetcher-create"}">
  <fieldset>
    <legend>step info</legend>
    <label for="name"><strong>Name</strong></label>
    <input
      placeholder="Name"
      type="text"
      id="name"  ${addVal(values, "name")}
      name="name"/>

    <section class="columns gap">
      <div class="column">
	<label for="frequency"><strong>Batch frequency</strong><br/>
<small>How often the step will look for new data.</small></label>
	<input
	  placeholder="Seconds"
	  type="number"
	  id="frequency" ${addVal(values, "frequency")}
	  name="frequency"/>
      </div>

      <div class="column">
	<label for="batchSize"><strong>Batch size</strong><br/>
<small>Maximum tasks that will be posted.</small></label>
	<input
	  placeholder="Amount"
	  type="number"
	  id="batchSize" ${addVal(values, "batchSize")}
	  name="batchSize"/>
      </div>
    </section>


      <label for="type"><strong>Data source</strong><br/>
      <small>How new tasks will be fetched.</small></label>
      <select name="type" id="type">${["csv", "fetcher", "constant"].map(a =>
	`<option value="${a}" ${values.type == a ? "selected" : ""}>${a}</option>`).join("")}
      </select>

  </fieldset>

  <fieldset>
    <legend>execution engine</legend>

    <label for="processor"><strong>Processor</strong><br/>
    <small>How data will be processed.</small></label>
    <select name="processor" id="processor">
      <option value="template">Effect AI App</option>
    </select>

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
    </section>

    <section>
      <label for="price"><strong>Price per task</strong></label>
      <input
	placeholder="$EFFECT"
	type="number"
	id="price"  ${addVal(values, "price")}
	name="price"/>
    </section>
  </fieldset>

 <button type="submit">${fid ? "Update" : "Create"}</button>
</form>
</div>
`;

const constantFetcherForm = async (dsId: number, values: FormValues) => `
<fieldset>
    <legend>constant fetcher config</legend>
    <div class="columns gap">
      <div class="column">
	<label for="frequency"><strong>Target queue size</strong><br/>
	<small>Constant task backlog to maintain.</small></label>
	<input
	  type="number"
	  id="target" ${addVal(values, "target")}
	  name="target"/>
      </div>

      <div class="column">
	<label for="batchSize"><strong>Max total tasks</strong><br/>
	<small>Maximum tasks it will emit.</small></label>
	<input
	  type="number"
	  id="max" ${addVal(values, "max")}
	  name="max"/>
      </div>
    </div>

    <section>
      <label for="data"><strong>Constant Data</strong><br/>
      <small>This data will be repeated for each task, can be empty. ` +
	`</small></label>
      <textarea placeholder="JSON" id="data" name="data" rows="10">` +
  `${values.data || ""}</textarea>
    </section>
</fieldset>
`;

const fetcherImportForm = async (f: Fetcher, values: {}, msg = "") => `
<div hx-swap="outerHTML" id="page">
<form hx-target="#page" hx-post="/d/${f.datasetId}/f/${f.index}/import">
  <div id="messages">
    ${msg ? `<p id="messages"><blockquote>${msg}</blockquote></p>` : ""}
  </div>


  ${f.type === "csv"
    ? await csvFetcherForm(f.datasetId, values)
    : f.type === "constant"
      ? await constantFetcherForm(f.datasetId, values)
      : `Error, invalid fetcher type ${f.type}`}
  <button type="submit">Configure</button>
</form>
</div>
`

export const writeFetcher = async(f:Fetcher) =>
  await db.set<Fetcher>(["fetcher", f.index, f.datasetId, "info"], f);

export const createFetcher = async (
  ds: DatasetRecord,
  fields: Record<any, any>,
) => {
  const csvData = await parseCsv(fields.csv, fields.delimiter);

  const nextId = db.count(["fetcher", ds.id, {}, "info"]) + 1;

  const f: Fetcher = {
    name: fields.name,
    lastImport: undefined,
    datasetId: ds.id,
    index: nextId,
    type: fields.type,
    taskIdx: 0,
    totalTasks: csvData.length,
    dataSample: csvData[0],

    delimiter: fields.delimiter,
    price: fields.price,
    template: fields.template,
    frequency: fields.frequency,
    batchSize: fields.batchSize,
    status: "active",
  };

  await db.set<Fetcher>(["fetcher", ds.id, nextId, "info"], f);

  return f;
};

// get the current active fetcher for a dataset
export const getFetcher = async (dsid: number, fid: number) => {
  const f = await db.get<Fetcher>(["fetcher", dsid, fid, "info"]);
  return f?.data;
};

// get the raw string data of the fetcher


// get all active fetchers
export const getFetchers = async (ds: DatasetRecord) => {
  const f = await db.listAll<Fetcher>(["fetcher", ds.id, {}, "info"]);

  // example: how to delete the last fetcher
  // await db.delete(f[f.length-1].key);

  return f.map(ff => ff.data);
};

const delay = (m: number): Promise<void> =>
  new Promise((r) => setTimeout(r, m));

export const getTasks = async (fetcher: Fetcher, csv: string) => {
  let data: any[] = [];
  switch (fetcher.type) {
    case "csv":
      if (csv && csv.length > 0)
	data = await parseCsv(csv);
      break;
    case "constant":
      if (fetcher.totalTasks <= (fetcher.maxTasks || 0)) {
	const queueSize = countTasks(fetcher, "queue");
	const nCreate = Math.max((fetcher.targetQueueSize || 0) - queueSize, 0);
	data = Array(nCreate).fill(fetcher.constantData || "");
	break;
      }
  }

  const tasks = data.map(
    (d, _idx) =>
      ({
	id: ulid(),
	title: fetcher.name,
	reward: BigInt(fetcher.price * 1000000),
	timeLimitSeconds: 600,
	templateId: fetcher.template,
	templateData: JSON.stringify(d),
      }) as Task,
  );

  return tasks;
};

export const getPendingTasks = async (f: Fetcher) => {

  const tasks = await db.listAll<boolean>(
    ["fetcher", f.datasetId, f.index, "queue", {}], f.batchSize, false
  );

  return tasks.map(t => t.key[4]);
};

// fetch new tasks and add the to the fetcher queue
const importFetcherData = async (fetcher: Fetcher, csv: string = "") => {
  let tasks = await getTasks(fetcher, csv);
  console.log(`trace: Importing ${tasks.length} new tasks for fetcher`);
  for (const t of tasks) {
    await db.set<Task>(["task", t.id], t);
    await db.set<boolean>(
      ["fetcher", fetcher.datasetId, fetcher.index, "queue", t.id], true
    );
  }
  return tasks;
};

// form submission handler for fetcher import
const handleFetcherImport = async(f: Fetcher, fields: FormValues) => {
  const fetcher = (await db.get<Fetcher>(
    ["fetcher", f.datasetId, f.index, "info"]
  ))!;

  switch (f.type) {
    case "csv":

      // nothing special here
      break;
    case "constant":
      fetcher.data.targetQueueSize = fields.target;
      fetcher.data.maxTasks = fields.max;
      fetcher.data.constantData = fields.data;
      break;
  }

  const tasks = await importFetcherData(fetcher.data, fields.csv);
  fetcher.data.totalTasks += tasks.length;
  await db.set<Fetcher>(fetcher.key, fetcher.data);
};

/**
 * Process fetcher
 *
 * 1) read tasks from the `backlog` queue and post to effect
 * 2) read tasks from the `active` queue and fetch results
 * 3)
 */
export const processFetcher = async (fetcher: Fetcher) => {
  publishProgress[fetcher.datasetId] ??= {};

  const fid = [fetcher.datasetId, fetcher.index];

  // check for import lock
  if (publishProgress[fetcher.datasetId][fetcher.index]) {
    console.log(`Error: trying to run on a locked fetcher ${fid}`);
    return -1;
  }

  // establish lock. TODO: small race condition here
  publishProgress[fetcher.datasetId][fetcher.index] = {
    current: 0,
    max: 0,
    failed: 0,
  };

  // fetch tasks into the backlog
  const fetched = await importFetcherData(fetcher);

  // post queue to Effect
  const imported = await importTasks(fetcher);

  // TODO: put proper value for result batch size
  await processResults(fetcher, 20);

  // release lock
  publishProgress[fetcher.datasetId][fetcher.index] = null;


  const fetcherEntry = (await db.get<Fetcher>(
    ["fetcher", fetcher.datasetId, fetcher.index, "info"]
  ))!;

  fetcherEntry.data.totalTasks += fetched.length;
  fetcherEntry.data.taskIdx += imported;
  if (imported > 0)
    fetcherEntry.data.lastImport = Date.now();
  await db.set<Fetcher>(fetcherEntry.key, fetcherEntry.data);

  return imported;
}

export const countTasks = (f: Fetcher, type: "active" | "queue" | "done") => {
  return db.count(["fetcher", f.datasetId, f.index, type, {}]);
};

/**
 * Reads tasks from the backlog queue and posts them to Effect.
 *
 * @returns the number of tasks imported. 0 = finished, -1 = do
 * not import now
 */
export const importTasks = async (f: Fetcher) => {
  // check if it's already time
  const remaining = f.lastImport
    ? f.lastImport + f.frequency * 1000 - Date.now()
    : 0;

  const fid = [f.datasetId, f.index];

  if (remaining > 0) {
    console.log(`Fetcher ${fid} import ${remaining / 1000}s remaining`);
    return -1;
  }

  const totalQueued = countTasks(f, "queue");

  // short wire if finished
  if (totalQueued <= 0) {
    console.log(`Skip import of ${fid}: no pending tasks`);
    return 0;
  }

  const tasks = await getPendingTasks(f);

  console.log(
    `Starting import of ${fid} for ${tasks.length} of ` +
      `${totalQueued} pending`,
  );

  let thisProgress = publishProgress[f.datasetId][f.index];

  // track state for progress bar
  thisProgress.max = tasks.length;

  for (const taskId of tasks) {
    // TODO: remove delay / think about throttling
    await delay(400);

    const task = await db.get<Task>(["task", taskId]);

    try {
      const serializedTask = {
	...task!.data,
	// convert bigint to string for serialization
	reward: task!.data.reward.toString(),
      };

      const { data } = await api.post<APIResponse>("/task", serializedTask);

      db.beginTransaction();
      await db.delete(["fetcher", ...fid, "queue", taskId]);
      await db.set<boolean>(["fetcher", ...fid, "active", taskId], true);
      await db.endTransaction();
      thisProgress.current += 1;
    } catch (e) {
      // TODO: save errors in db, retries with backoff
      console.log(`Error posting task ${taskId} ${e}`);
      thisProgress.failed += 1;
    }
  }

  return tasks.length;
};

export const processResults = async (f: Fetcher, batchSize: number) => {
  const keyBase = ["fetcher", f.datasetId, f.index];

  const tasks = await db.listAll<boolean>(
    [...keyBase, "active", {}], batchSize, false
  );

  let ids = tasks.map(t => t.key[4]);
  if (!ids || ids.length === 0)
    return;

  console.log(`trace: Checking results for ${ids.length} active tasks`);

  try {
    const { data } = await api.get<APIResponse>(
      "/task-results", {params: {ids: ids.join(";")}}
    );

    let importCount = 0;
    for (const d of data as any) {
      if (d.type !== "submission")
	continue;
      db.beginTransaction();
      await db.delete([...keyBase, "active", d.taskId]);
      await db.set<boolean>([...keyBase, "done", d.taskId], true);
      // TODO: add type for TaskResult in the sdk
      await db.set<any>(["task-result", d.taskId], d);
      await db.endTransaction();
      importCount++;

      console.log(`trace: ${importCount} tasks finished`);
    }
  } catch (e) {
    console.log(`error: ${e}`);
  }
};

type ValidationFunction = (v: any) => string | boolean | undefined | null;
type ValidationMap = Record<string, ValidationFunction>;

const importValidations = (f: Fetcher) : ValidationMap => {
  switch (f.type) {
  case "csv":
    return {
      delimiter: (v: string) =>
	![",", "\t", ";"].includes(v) && "Invalid CSV delimiter",
      csv: (v: string) => (!v || v.length === 0) && "CSV is required",
    };
    case "constant":
      return {
	max: (v) => {
	  const num = Number(v);
	  return !num ? "Max required"
	    : isNaN(num) ? "Max must be number"
	      : num <= 0 && "Max must be positive";
	},
	target: (v) => {
	  const num = Number(v);
	  return !num ? "Target required"
	    : isNaN(num) ? "Target must be number"
	      : num <= 0 && "Target must be positive";
	}
      }
  }
  return {};
};

const formValidations: ValidationMap = {
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
	: num <= 0
	  ? "Price must be greater than 0"
	  : num > 100 && "Price too large";
  },

  template: (v: string) => (!v || v.length === 0) && "Template is required",
};

const validateForm = async (
  values: FormValues,
  validations: any = formValidations
) => {
  const errors: Record<string, string> = {};

  Object.keys(validations).forEach((field) => {
    const error = validations[field](values[field]);
    if (error) errors[field] = error as string;
  });

  const valid = Object.keys(errors).length === 0;
  return { valid, errors };
};

export const addFetcherRoutes = (app: Express): void => {
  // TODO: parse the ?type=csv parameter for more fetchers
  app.get("/d/:id/create-fetcher", async (req, res) => {
    const id = Number(req.params.id);
    res.send(page(await fetcherForm(id, {}, "")))
  });

  app.get("/d/:id/f/:fid/edit", async (req, res) => {
    const id = Number(req.params.id);
    const fid = Number(req.params.fid);
    const f = await getFetcher(id, fid);

    res.send(page(await fetcherForm(id, f!, "", fid)));
  });

  app.post("/d/:id/f/:fid/edit", async (req, res) => {
    const id = Number(req.params.id);
    const fid = Number(req.params.fid);
    const f = await getFetcher(id, fid);
    const dataset = (await db.get<DatasetRecord>(["dataset", id, "info"]))!.data;

    let { valid, errors } = await validateForm(req.body);
    let msg = Object.values(errors).join("<br/>- ");
    msg = msg ? "- " + msg : "";

    if (valid) {
      const f = await createFetcher(dataset, req.body);
      res.setHeader("HX-Location", `/d/${id}/f/${f.index}`);
      res.send();
    } else {
      msg = '<h4 style="margin-top: 0;">Could not create dataset:</h4>' + msg;
      console.log(`Invalid form submission ${msg}`);
      res.send(await fetcherForm(id, req.body, msg));
    }
  });

  app.get("/d/:id/f/:fid", async (req, res) => {
    const id = Number(req.params.id);
    const fid = Number(req.params.fid);
    const f = await getFetcher(id, fid);

    const queueSize = countTasks(f!, "queue");
    const activeSize = countTasks(f!, "active");
    const doneSize = countTasks(f!, "done");

    const resultIds = (await db.listAll<boolean>(
      ["fetcher", f!.datasetId, f!.index, "done", {}], 200, true
    ))!;
    const results = (await Promise.all(
      resultIds.map(i => db.get<any>(["task-result", i.key[4]]))
    )).map(p => p!.data)
      .map(p => { p["timestamp"] = formatDate(p["timestamp"]); return p; });

    let cols = ["timestamp", "submissionByPeer", "taskId", "result"];

    if (f)
      res.send(page(`
<div class="container">
<h3>Step ${f.name}</h3>
<ul>
  <li>Last fetch: ${formatDate((f!.lastImport || 0) / 1000)}</li>
  <li>Type: ${f.type}</li>
  <li>Queued: ${queueSize}</li>
  <li>Active: ${activeSize}</li>
  <li>Finished: ${doneSize}</li>
  <li>Total: ${f.totalTasks}</li>
  <li>Batch / Freq: ${f.batchSize} / ${f.frequency}</li>
</ul>

<section>
  <a href="/d/${id}/f/${fid}/import"><button>Add Data</button></a>
  <a href="/d/${id}/f/${fid}/edit"><button>Edit Step</button></a>
</section>

<section>
<h3>Last 200 results</h3>
</div>
<table style="font-size: 9px; margin: 0 auto;">
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${results.map((r: any) => `
      <tr>${cols.map(c => `<td>${r[c]}</td>`).join("")}</tr>`).join("")}
    </tbody>
</table>
</section>
`, ""));
    else
      return make404(res);
  });

  app.post("/d/:id/fetcher-create", async (req, res) => {
    const id = Number(req.params.id);
    const dataset = (await db.get<DatasetRecord>(["dataset", id, "info"]))!.data;

    let { valid, errors } = await validateForm(req.body);
    let msg = Object.values(errors).join("<br/>- ");
    msg = msg ? "- " + msg : "";

    if (valid) {
      const f = await createFetcher(dataset, req.body);
      res.setHeader("HX-Replace-Url", `/d/${id}/f/${f.index}/import`);
      res.send(await fetcherImportForm(f!, req.body, "Fetcher saved. Add data."));
    } else {
      msg = '<h4 style="margin-top: 0;">Could not create dataset:</h4>' + msg;
    }

    if (valid) {
      // res.setHeader("HX-Location", `/d/${id}`);
      // res.end();
    } else {
      console.log(`Invalid form submission ${msg}`);
      res.send(await fetcherForm(id, req.body, msg));
    }
  });

  app.get("/d/:id/f/:fid/import", async (req, res) => {
    const id = Number(req.params.id);
    const fid = Number(req.params.fid);
    const f = await getFetcher(id, fid);

    res.send(page(await fetcherImportForm(f!, {
      max: f?.maxTasks,
      target: f?.targetQueueSize,
      data: f?.constantData,
    })));
  });

  app.get("/task/:tid", async (req, res) => {
    const tid = req.params.tid;
    const t = await db.get<Task>(["task", tid]);
    const ts = JSON.stringify(t, (_, v) => typeof v === 'bigint' ? v.toString() : v)
    res.send(ts);
  });

  app.post("/d/:id/f/:fid/import", async (req, res) => {
    const id = Number(req.params.id);
    const fid = Number(req.params.fid);
    const f = await getFetcher(id, fid);

    let { valid, errors } = await validateForm(req.body, importValidations(f!));
    let msg = Object.values(errors).join("<br/>- ");
    msg = msg ? "- " + msg : "";

    if (valid) {
      try {
	await handleFetcherImport(f!, req.body);

	res.setHeader("HX-Location", `/d/${id}/f/${fid}`);
	res.end();
      } catch (e) {
	valid = false;
	msg += "- " + e;
      }
    }

    if (!valid) {
      msg = '<h4 style="margin-top: 0;">Could not create dataset:</h4>' + msg;
      console.log(`Invalid form submission ${msg}`);
      res.send(await fetcherImportForm(f!, req.body, msg));
    }
  });
};
