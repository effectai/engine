import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { addLiveReload } from "./livereload.js";
import { isHtmx, page } from "./html.js";
import { managerId, db } from "./state.js";
import { addTemplateRoutes, type TemplateRecord } from "./templates.js";

const app = express();
const PORT = 3000;

// only add livereload when the flag is provided on dev
const liveReloadEnabled = process.argv.includes("--livereload");
if (liveReloadEnabled) await addLiveReload(app);

// serve static files in public folder
app.use(express.static("public"));
// parse url encoded payloads
app.use(express.urlencoded({ extended: true }));
// parse json form data
app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    page(`
<p>Select a manager:</p>
<form action="/m" method="post" hx-post="/m">
  <select name="manager" style="width: 100%;">
    <option value="${managerId}">/ip4/127.0.0.1/tcp/11995/ws/p2p/12D3K..f9cPb</option>
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

app.get("/m/:manager", async (req, res) => {
  const templates = (await db.listAll<TemplateRecord>(["templates", {}])).map(
    (t) => `${t.data.createdAt} - ${t.data.name || "[no name]"}`,
  );
  res.send(
    page(`
<strong>Manager:</strong> ${req.params.manager}

<h3>Known Templates</h3>
<ul><li>${templates.join("</li><li>")}</li></ul>
<a href="/t/create"><button>Create Template</button></a>
<a href="/t/create"><button>Create Dataset</button></a>
`),
  );
});

addTemplateRoutes(app);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
