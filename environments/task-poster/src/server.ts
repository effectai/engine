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
import { db } from "./state.js";
import { randomUUID } from "crypto";
import { all } from "axios";

const addMainRoutes = (app: Express) => {

  app.post("/task-result", async (req, res) => {
  const { result } = req.body;

  if (!result) {
    res.status(400).send("Missing required field");
    return;
  }

  const resultId = randomUUID(); 
  const key = ["task-result", resultId];

  try {
    await db.set(key, {
      id: resultId,
      result,
      createdAt: Date.now(),
    });

    res.send({ success: true, id: resultId });
  } catch (e) {
    console.error("Failed to save task result:", e);
    res.status(500).send("Failed to save result");
  }
});

app.get("/task-results", async (req, res) => {
  let taskId = req.query.templateId as string | undefined;
  const currentPage = parseInt(req.query.page as string) || 1;
  const limit = 3;
  const offset = (currentPage - 1) * limit;

  const templates = await getTemplates();
  const templateIDs = templates.map(t => t.data.templateId);

  const taskTitles = templates.map(template => {
    const id = template.data.templateId;
    const name = template.data.name || id;
    const selected = id === taskId ? "selected" : "";
    return `<option value="${id}" ${selected}>${name}</option>`;
  });

  const selectedIsAll = taskId === "all" || !taskId;
  const templateIDsToFetch = selectedIsAll ? templateIDs : [taskId];

  try {
    const allTaskLists = await Promise.all(
      templateIDsToFetch.map(async (id) => {
        const res = await fetch(`http://localhost:8889/tasks/${id}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data;
      })
    );

    const taskList = allTaskLists.flat();

    const parsedTasks = taskList.map((task: any) => {
      try {
        const result = typeof task.result === "string" ? JSON.parse(task.result) : task.result;
        const values = result?.values || {};
        return { taskID: task.taskID, values };
      } catch (err) {
        console.error("Failed to parse result for task", task.taskID);
        return null;
      }
    }).filter(Boolean);

    if (parsedTasks.length === 0) {
      return res.send("<p>No valid tasks found.</p>");
    }

    const totalPages = Math.ceil(parsedTasks.length / limit);
    const paginatedResults = parsedTasks.slice(offset, offset + limit);

    const uniqueFieldKeys = new Set<string>();

    paginatedResults.forEach(task => {
      Object.keys(task.values).forEach(fieldKey => uniqueFieldKeys.add(fieldKey));
    });

    const tableHeaders = Array.from(uniqueFieldKeys);

    const headerRowHtml = tableHeaders.map(fieldName => `<th>${fieldName}</th>`)
      .join("");

    const bodyRowsHtml = paginatedResults
    .map(task => {
      const cellsHtml = tableHeaders
        .map(fieldName => {
          const value = task.values[fieldName];
          return `<td>${Array.isArray(value) ? JSON.stringify(value) : (value ?? "")}</td>`;
        })
        .join("");
      return `<tr>${cellsHtml}</tr>`;
    })
    .join("");

    const paginationControls = Array.from({ length: totalPages }, (_, i) => {
      const p = i + 1;
      const isCurrent = p === currentPage ? 'style="font-weight:bold;"' : "";
      return `<a href="/task-results?templateId=${taskId || "all"}&page=${p}" ${isCurrent}>${p}</a>`;
    }).join(" ");

    res.send(
      page(`
        <h1>Task Results</h1>
        <div style="display: flex">
          <form method="GET" action="/task-results">
            <label for="taskFilter">Filter by Task:</label>
            <select name="templateId" id="taskFilter" onchange="this.form.submit()">
              <option value="all" ${selectedIsAll ? "selected" : ""}>All</option>
              ${taskTitles.join("")}
            </select>
            <noscript><button type="submit">Filter</button></noscript>
          </form>

          <a href="/task-results/download?templateId=${taskId || "all"}" style="margin-left: 1em;">
            <button type="button">Download CSV</button>
          </a>
        </div>
        <table border="1" style="border-collapse: collapse;">
          <thead><tr>${headerRowHtml}</tr></thead>
          <tbody>${bodyRowsHtml}</tbody>
        </table>

        <div style="margin-top: 1em;">
          ${paginationControls}
        </div>
      `)
    );

  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching task results.");
  }
});

app.get("/task-results/download", async (req, res) => {
  const taskId = req.query.templateId;
  const templates = await getTemplates();

  const templateIDs = templates.map(t => t.data.templateId);
  const selectedIsAll = taskId === "all" || !taskId;
  const templateIDsToFetch = selectedIsAll ? templateIDs : [taskId];

  try {
    const allTaskLists = await Promise.all(
      templateIDsToFetch.map(async (id) => {
        const response = await fetch(`http://localhost:8889/tasks/${id}`);
        if (!response.ok) return [];
        return await response.json();
      })
    );

    const allTasks = allTaskLists.flat();

    const parsed = allTasks.map((task: any) => {
      try {
        const result = typeof task.result === "string" ? JSON.parse(task.result) : task.result;
        return result?.values || {};
      } catch {
        return null;
      }
    }).filter(Boolean);

    if (parsed.length === 0) {
      return res.status(404).send("No valid task results found.");
    }

    const headersSet = new Set<string>();
    parsed.forEach(obj => Object.keys(obj).forEach(key => headersSet.add(key)));
    const headers = Array.from(headersSet);

    const rows = [headers];
    parsed.forEach(obj => {
      const row = headers.map(key => {
        const val = obj[key];
        const safe = val === null || val === undefined ? "" : (Array.isArray(val) ? JSON.stringify(val) : String(val));
        return `"${safe.replace(/"/g, '""')}"`;
      });
      rows.push(row);
    });

    const csv = rows.map(row => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="task-results-${taskId || "all"}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error("Failed to generate CSV:", err);
    res.status(500).send("Error generating CSV.");
  }
});

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
        <div class="boxbox">${tmpList.join("")}</div>
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
        </div>
      `);
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
