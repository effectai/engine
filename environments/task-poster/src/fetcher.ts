import axios from "axios";
import { parseString } from "@fast-csv/parse";
import { managerId, db, publishProgress } from "./state.js";
import * as state from "./state.js";
import type { DatasetRecord } from "./dataset.js";
import { stringifyWithBigInt, Task } from "@effectai/protocol";
import { ulid } from "ulid";

// TODO: can this come out of the protocol package?

type APIResponse = {
  status: string;
  data?: any;
  error?: string;
};

type Fetcher = {
  lastImport: number | undefined;
  datasetId: number;
  type: "csv";
  data: string;
  delimiter: "," | "\t" | ";";
  taskIdx: number;
  totalTasks: number;
  dataSample: any;
};

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  baseURL: state.managerUrl,
});

const parseCsv = (csv: string, delimiter: string = ","): Promise<any[]> => {
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

export const createCsvFetcher = async (
  ds: DatasetRecord,
  csv: string,
  delimiter: "\t" | "," | ";" = ",",
) => {
  const csvData = await parseCsv(csv, delimiter);

  const f: Fetcher = {
    lastImport: undefined,
    datasetId: ds.id,
    type: "csv",
    data: csv,
    taskIdx: 0,
    totalTasks: csvData.length,
    dataSample: csvData[0],
    delimiter,
  };

  await db.set<Fetcher>(["fetcher", ds.id, ds.activeFetcher], f);
};

// get the current active fetcher for a dataset
export const getFetcher = async (ds: DatasetRecord) => {
  // TODO: generalize from csv (we only have CSV fetcher at the moment)
  const f = await db.get<Fetcher>(["fetcher", ds.id, ds.activeFetcher]);
  return f!.data;
};

const delay = (m: number): Promise<void> =>
  new Promise((r) => setTimeout(r, m));

export const getTasks = async (ds: DatasetRecord, fetcher: Fetcher) => {
  const csvData = await parseCsv(fetcher.data);

  return csvData.map((d, idx) => ({
    id: ulid(),
    title: `${ds.name}`,
    reward: BigInt(ds.price * 1000000),
    timeLimitSeconds: 600,
    templateId: ds.template,
    templateData: JSON.stringify(d),
  }));
};

export const getPendingTasks = async (ds: DatasetRecord, f: Fetcher) => {
  const tasks = await getTasks(ds, f);
  return tasks.slice(f.taskIdx);
};

// returns the number of tasks imported. 0 = finished, -1 = other error
export const importTasks = async (ds: DatasetRecord) => {
  const fetcher = await db.get<Fetcher>(["fetcher", ds.id, ds.activeFetcher]);

  // check for import lock
  if (publishProgress[ds.id]) {
    console.log(`Error: tryting to run on a locked dataset ${ds.id}`);
    return -1;
  }

  // short wire if finished
  if (fetcher!.data.taskIdx >= fetcher!.data.totalTasks) {
    console.log(`Skip import of ${ds.id}: no pending tasks`);
    return 0;
  }

  const pendingTasks = await getPendingTasks(ds, fetcher!.data);
  const tasks = pendingTasks.slice(0, ds.batchSize);

  console.log(
    `Starting import of ds ${ds.id} for ${tasks.length} of ` +
      `${pendingTasks.length} pending`,
  );

  // track state for progress bar
  publishProgress[ds.id] = {
    current: 0,
    max: tasks.length,
    failed: 0,
  };

  for (const task of tasks) {
    // TODO: remove delay / think about throttling
    await delay(400);

    try {
      // TODO: save posted tasks in DB, for result tracking etc

      const serializedTask = {
        ...task,
        //convert bigint to string for serialization
        reward: task.reward.toString(),
      };

      const { data } = await api.post<APIResponse>("/task", serializedTask);
      publishProgress[ds.id].current += 1;
    } catch (e) {
      // TODO: save errors in db, retries with backoff
      console.log(`Error posting task ${task} ${e}`);
      publishProgress[ds.id].failed += 1;
    }
  }

  publishProgress[ds.id] = undefined;
  fetcher!.data.taskIdx += tasks.length;
  fetcher!.data.lastImport = Date.now();

  await db.set<Fetcher>(fetcher!.key, fetcher!.data);

  return tasks.length;
};
