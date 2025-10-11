import axios from "axios";
import type { Express } from "express";
import { requireAuth } from "./auth.js";
import { isHtmx, make404, make500, page } from "./html.js";
import { db, managerId } from "./state.js";
import * as state from "./state.js";
import { createHash } from "node:crypto";
import type { Template } from "@effectai/protobufs";

export const computeTemplateId = (provider: string, template_html: string) => {
  const input = `${provider}:${template_html}`;
  const sha256 = createHash("sha256").update(input).digest("hex");
  return sha256;
};

type APIResponse = {
  status: string;
  data?: any;
  error?: string;
  id?: string;
};

export type TemplateRecord = {
  createdAt: number;
  name: string;
  templateId: string;
  data: string;
  status: "draft" | "active" | "archived";
};

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  baseURL: state.managerUrl,
});

export const escapeHTML = (html: string): string =>
  html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const getTemplates = async (status?: string) => {
  // TODO: support order by created at
  const l = await db.listAll<TemplateRecord>(["templates", {}]);
  if (status) return l.filter((t) => t!.data.status === status);
  else return l;
};
export const getTemplate = async (id: string) =>
  await db.get<TemplateRecord>(["templates", id]);

export const renderTemplate = async (
  html: string,
  data: any,
): Promise<string> => {
  const templateHtml = html.replace(/\$\{([^}]+)\}/g, (_: any, key: any) => {
    const keyName = key.trim();
    const rawValue = data[keyName];
    if (rawValue === undefined) return "";
    const escapedValue =
      typeof rawValue === "string"
        ? rawValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
        : rawValue;
    return escapedValue;
  });

  return templateHtml;
};

const findTemplateFields = (html: string) => {
  const re = /\$\{([^}]+)\}/g;
  const matches: string[][] = [];
  let m;
  do {
    const m = re.exec(html);
    if (m) matches.push(m.slice(0, 3));
  } while (m);
  return matches;
};

const form = (msg = "", values: Record<string, string> = {}): string => `
<form id="main-form" hx-post="/t/create" hx-swap="outerHTML">
  ${msg ? `<p><blockquote>${msg}</blockquote></p>` : ""}
  <fieldset style="width: 100%;">

    <!-- <legend>New Template</legend>
    <label for="name">Name</label> -->
    <input
      placeholder="Template name"
      type="text"
      id="name"
      ${values.name ? `value="${values.name}"` : ""}
      name="name"/>

    <!-- <label for="html">HTML</label> -->
    <textarea
      placeholder="<html>"
      id="html"
      name="html"
      rows="10">${escapeHTML(values.html || "")}</textarea>

    <button type="submit">Preview</button>
  </fieldset>
</form>
`;

const templateDataForm = (
  html: string,
  fields: string[][],
  values: Record<string, string> = {},
) => `
<form hx-post="/t/test">
${fields.map(
  ([_, name]) => `
<label for="f${name}">${name}</label>
<input
  ${values[name] ? `value="${escapeHTML(values[name])}" ` : ""}
  id="f${name}" name="${name}" type="text"></input>
<textarea style="display: none;" name="html">${escapeHTML(html)}</textarea>
<button type="submit">Preview</button>
</form>
`,
)}
`;

const templatePreviewFrame = async (
  html: string,
  data: Record<string, string> = {},
) => {
  const renderedTemplate = await renderTemplate(html, data);
  const fields = findTemplateFields(html);
  return `
<h2>Preview</h2>
<div>
  <iframe
    id="templateFrame"
    height="450px"
    width="100%"
  srcdoc="${escapeHTML(renderedTemplate)}"></iframe>
</div>

<h2>Task Data</h2>
${fields.length ?
  `<p>You use this form to preview the template with example data</p>
${templateDataForm(html, fields)}` :
  "<p>This template has no fields.</p>"}
`
  };

// block that lists active templates
const tplListFrame = async () => {
  const allTpls = await getTemplates();

  const renderList = (status: string) => {
    const tpls = allTpls.filter(t => t!.data.status === status);
    const tplList = tpls.map(t => `
<a class="box" href="/t/${t.data.templateId}">
  ${t.data.name || "[no name]"} (${t.data.createdAt})
</a>`
    );
    return [
      tpls.length,
      `${tpls.length ? `<div class="boxbox">${tplList.join("")}</div>` : ""}`
    ]
  };

  const [nActive, activeList] = renderList("active");
  const [nDraft, draftList] = renderList("draft");

  return `
<h3>Active Templates (${nActive})</h3>
${activeList}

<section>
  <a href="/t/create"><button>+ New Template</button></a>
</section>

<section>
  <h3>Drafts (${nDraft})</h3>
  ${draftList}
</section>
`;
};

const tplViewPage = async (tpl: TemplateRecord) => {
  return `
<div id="page">
<h2>Template: ${tpl.name}</h2>
<strong>Status ${tpl.status}</strong>

${await templatePreviewFrame(tpl.data)}

<section>
  ${tpl.status == "active" ?
   `<button hx-post="/t/${tpl.templateId}?action=archive">Archive</button>` : ''}

  ${tpl.status == "draft" ?
   `<button hx-post="/t/${tpl.templateId}?action=publish">Publish</button>` : ''}

  ${tpl.status == "active" ? `<p><small>* Archiving a template will hide it from `
+ `the UI and dataset selection field</small></p>` : ''}

</section>
</div>
`;
};

export const addTemplateRoutes = (app: Express): void => {
  app.get("/templates", requireAuth, async (_req, res) => {
    res.send(page(`${await tplListFrame()}`));
  });

  app.get("/t/create", requireAuth, (_req, res) => {
    res.send(page(form()));
  });

  app.post("/t/create", requireAuth, async (req, res) => {
    let valid = true;
    let msg = "";

    if (!req.body.name) {
      valid = false;
      msg += `Template name can't be empty<br/>`;
    }

    if (!req.body.html) {
      valid = false;
      msg += `HTML can't be empty`;
    }

    if (valid && req.query.action === "publish") {
      const templateId = computeTemplateId(managerId, req.body.html);
      console.log(`Publishing new template ${templateId}...`);

      const template: Template = {
        templateId,
        data: req.body.html,
        createdAt: Date.now(),
      };

      try {
        const { data } = await api.post<APIResponse>("/template/register", {
          template,
          providerPeerIdStr: managerId,
        });
        msg = `<p>Success! ${data.status}:</p><p>${data.id}</p>`;
      } catch (e) {
        console.log(`Errors during registration`, e);
        msg = "Error during template registration.";
        valid = false;
      }

      const templateEntry: TemplateRecord = {
        ...template,
        name: req.body.name,
        status: "active",
      };
      await db.set<TemplateRecord>(["templates", templateId], templateEntry);
    }
    if (req.query.action === "edit") {
      res.send(form(undefined, req.body));
    } else if (valid && req.query.action === "publish") {
      res.send(`
      <div id="page" hx-swap-oob="true">
	<blockquote>${msg}</blockquote>
	<p><a href="/"><button>Home</button></a></p>
      </div>
      `);
    } else if (valid) {
      res.send(`
<div id="page">
  ${await templatePreviewFrame(req.body.html)}
  <section>
<form>
    <textarea style="display: none;" name="html">${escapeHTML(req.body.html)}</textarea>
    <input type="hidden" name="name" value="${req.body.name}">
    <div class="btns">
      <button hx-target="#page" hx-post="/t/create?action=edit">< Edit</button>
      <button hx-target="#page" hx-post="/t/create?action=publish">! Publish</button>
    </div>
  </section>
</form>
</div>`);
    } else {
      // invalid parameters
      res.send(form(msg, req.body));
    }
  });

  app.get("/t/:id", requireAuth, async (req, res) => {
    const tid = req.params.id;
    const tpl = await getTemplate(tid);
    if (!tpl) return make404(res);
    res.send(page(await tplViewPage(tpl!.data)));
  });

  app.post("/t/test", requireAuth, async (req, res) => {
    const html = req.body.html;

    if (!html) {
      res.status(404);
      res.send("not found");
      res.end();
      return;
    }

    const renderedTemplate = await renderTemplate(html, req.body);
    const fields = findTemplateFields(html);

    res.send(`
<iframe
  hx-swap-oob="true"
  id="templateFrame"
  height="450px"
  width="100%"
  srcdoc="${escapeHTML(renderedTemplate)}"></iframe>

${templateDataForm(escapeHTML(html), fields, req.body)}`);
  });

  app.post("/t/:id", requireAuth, async (req, res) => {
    const tid = req.params.id;
    const tpl = await getTemplate(tid);
    if (!tpl) return make404(res);

    console.log(`Trace: post ${req.query.action} template ${tid}`);

    var msg = "";
    if (req.query.action === "archive") {
      if (tpl!.data.status !== "active") return make500(res);
      tpl!.data.status = "draft";
      await db.set<TemplateRecord>(tpl!.key, tpl!.data);
      msg = "Successfully archived template";
    } else if (req.query.action === "publish") {
      if (tpl!.data.status !== "draft") return make500(res);
      tpl!.data.status = "active";
      await db.set<TemplateRecord>(tpl!.key, tpl!.data);
      msg = "Successfully published template";
    } else {
      return make500(res);
    }

    res.send(`
      <div id="page" hx-swap-oob="true">
	<blockquote>${msg}</blockquote>
	<p><a href="/"><button>Home</button></a></p>
      </div>
      `);
  });
};
