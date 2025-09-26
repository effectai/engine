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
  type: "csv";
  data: string; // deprecated field, data is stored as separate object
  delimiter: "," | "\t" | ";";

  name: string;
  price: number;
  frequency: number;
  batchSize: number;
  template: string;

  taskIdx: number; // the last task processed
  totalTasks: number;
  dataSample: any;
  status: "active" | "archived";
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

// little shorthand to inject form field's value if it exists
const addVal = (values: FormValues, key: string): string =>
  `${values[key] ? `value="${values[key]}"` : ""}`;
type FormValues = Record<string, any>;

// how to validate the csv field:
// delimiter: (v: string) =>
// ![",", "\t", ";"].includes(v) && "Invalid CSV delimiter",


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

export const fetcherForm = async (dsId: number, values: FormValues, msg = "") => `
<div id="page">
<form hx-post="/d/${dsId}/fetcher-create">
  <div id="messages">
    ${msg ? `<p id="messages"><blockquote>${msg}</blockquote></p>` : ""}
  </div>
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


      <label for="fetcher-type"><strong>Data source</strong><br/>
      <small>How new tasks will be fetched.</small></label>
      <select name="processor" id="processor">
	<option value="csv">CSV</option>
	<option value="fetcher">Previous step</option>
	<option value="constant">Constant value</option>
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

${await csvFetcherForm(dsId, values)}

<button type="submit">Create</button>

</form>
</div>
`;


export const createCsvFetcher = async (
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
    type: "csv",
    data: "",
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
  await db.set<string>(["fetcher", ds.id, nextId, "data"], fields.csv);

  await importCsv(f, fields.csv);

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
  const csvData = await parseCsv(csv);

  return csvData.map(
    (d, idx) =>
      ({
	id: ulid(),
	title: fetcher.name,
	reward: BigInt(fetcher.price * 1000000),
	timeLimitSeconds: 600,
	templateId: fetcher.template,
	templateData: JSON.stringify(d),
      }) as Task,
  );
};

export const getPendingTasks = async (f: Fetcher) => {

  const tasks = await db.listAll<boolean>(
    ["fetcher", f.datasetId, f.index, "queue", {}], f.batchSize, false
  );

  return tasks.map(t => t.key[4]);
};

const importCsv = async (fetcher: Fetcher, csv: string) => {
  let tasks = await getTasks(fetcher, csv);
  tasks.forEach(async (t) =>  {
    await db.set<Task>(["task", t.id], t);
    await db.set<boolean>(
      ["fetcher", fetcher.datasetId, fetcher.index, "queue", t.id], true
    );
  });
};


/**
 * Process fetcher
 *
 * 1) read tasks from the `backlog` queue and post to effect
 * 2) read tasks from the `active` queue and fetch results
 * 3)
 */
export const processFetcher = async (fetcher: Fetcher) => {
  // check if it's already time
  const remaining = fetcher.lastImport
    ? fetcher.lastImport + fetcher.frequency * 1000 - Date.now()
    : 0;

  const fid = [fetcher.datasetId, fetcher.index];

  if (remaining > 0) {
    console.log(`Fetcher ${fid} import ${remaining / 1000}s remaining`);
    return -1;
  }

  publishProgress[fetcher.datasetId] ??= {};

  // check for import lock
  if (publishProgress[fetcher.datasetId][fetcher.index]) {
    console.log(`Error: trying to run on a locked fetcher ${fid}`);
    return -1;
  }

  publishProgress[fetcher.datasetId][fetcher.index] = {
    current: 0,
    max: 0,
    failed: 0,
  };

  const imported = await importTasks(fetcher);

  // TODO: put proper value for result batch size
  await processResults(fetcher, 20);

  publishProgress[fetcher.datasetId][fetcher.index] = null;

  return imported;
}

export const countTasks = (f: Fetcher, type: "active" | "queue" | "finished") => {
  return db.count(["fetcher", f.datasetId, f.index, type, {}]);
};

/**
 * Reads tasks from the backlog queue and posts them to Effect.
 *
 * @returns the number of tasks imported. 0 = finished, -1 = do
 * not import now
 */
export const importTasks = async (f: Fetcher) => {
  const fetcher = (await db.get<Fetcher>(
    ["fetcher", f.datasetId, f.index, "info"]
  ))!;

  const totalQueued = countTasks(f, "queue");

  // short wire if finished
  if (totalQueued <= 0) {
    console.log(`Skip import of ${fetcher.key}: no pending tasks`);
    return 0;
  }

  const tasks = await getPendingTasks(fetcher.data);

  console.log(
    `Starting import of ${fetcher.key} for ${tasks.length} of ` +
      `${totalQueued} pending`,
  );

  let thisProgress = publishProgress[fetcher.data.datasetId][fetcher.data.index];

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
      await db.delete([...fetcher.key.slice(0, 3), "queue", taskId]);
      await db.set<boolean>([...fetcher.key.slice(0, 3), "active", taskId], true);
      await db.endTransaction();
      thisProgress.current += 1;
    } catch (e) {
      // TODO: save errors in db, retries with backoff
      console.log(`Error posting task ${taskId} ${e}`);
      thisProgress.failed += 1;
    }
  }

  // release the lock and update stats
  fetcher!.data.taskIdx += tasks.length;
  fetcher!.data.lastImport = Date.now();

  await db.set<Fetcher>(fetcher!.key, fetcher!.data);

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

  const { data } = await api.get<APIResponse>(
    "/task-results", {params: {ids: ids.join(";")}}
  );

  for (const d of data as any) {
    if (d.type !== "submission")
      continue;
    db.beginTransaction();
    await db.delete([...keyBase, "active", d.taskId]);
    await db.set<boolean>([...keyBase, "done", d.taskId], true);
    await db.set<any>(["task-result", d.taskId], d);
    await db.endTransaction();
  }
};

type ValidationFunction = (v: any) => string | boolean | undefined | null;
type ValidationMap = Record<string, ValidationFunction>;

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
	: num <= 0
	  ? "Price must be greater than 0"
	  : num > 100 && "Price too large";
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

export const addFetcherRoutes = (app: Express): void => {
  // TODO: parse the ?type=csv parameter for more fetchers
  app.get("/d/:id/create-fetcher", async (req, res) => {
    const id = Number(req.params.id);
    res.send(page(await fetcherForm(id, {}, "")))
  });

  app.get("/d/:id/f/:fid", async (req, res) => {
    const id = Number(req.params.id);
    const fid = Number(req.params.fid);
    const f = await getFetcher(id, fid);

    const queueSize = countTasks(f!, "queue");
    const activeSize = countTasks(f!, "active");

    const resultIds = (await db.listAll<boolean>(
      ["fetcher", f!.datasetId, f!.index, "done", {}]
    ))!;
    const results = (await Promise.all(
      resultIds.map(i => db.get<any>(["task-result", i.key[4]]))
    )).map(p => p!.data);

    let cols = ["timestamp", "peer", "taskId", "result"];

    if (f)
      res.send(page(`
<h3>Step ${f.name}</h3>
<ul>
  <li>Last fetch: ${Math.ceil((Date.now() - (f!.lastImport || 0)/1000))}s ago</li>
  <li>Type: ${f.type}</li>
  <li>Queued: ${queueSize}</li>
  <li>Active: ${activeSize}</li>
</ul>

<h3>Last 20 results</h3>
<table>
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>
    <tbody>${results.map((r: any) => `
      <tr>${cols.map(c => `<th>${r[c]}</th>`).join("")}</tr>`).join("")}
    </tbody>
</table>
`));
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
      const f = await createCsvFetcher(dataset, req.body);

    } else {
      msg = '<h4 style="margin-top: 0;">Could not create dataset:</h4>' + msg;
    }

    if (valid) {
      res.setHeader("HX-Location", `/d/${id}`);
      res.end();
    } else {
      console.log(`Invalid form submission ${msg}`);
      res.send(await fetcherForm(id, req.body, msg));
    }
  });
};
