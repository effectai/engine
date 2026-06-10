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
  // Requestor-API fields (absent on legacy/team templates):
  ownerId?: string; // undefined = team/default template (public catalog)
  approved?: boolean; // trust badge; team templates are implicitly approved
  approvalRequested?: boolean; // queued for team review
};

// A template is "trusted" if the team approved it, or it's a team template
// (no owner). Content-addressing means an approval verdict is tied to the
// exact HTML, so it can safely be shared across requestors using it.
export const isTemplateApproved = (tpl: TemplateRecord): boolean =>
  tpl.approved === true || !tpl.ownerId;

export const isPublicTemplate = (tpl: TemplateRecord): boolean => !tpl.ownerId;

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  baseURL: state.managerUrl,
});

export const escapeHTML = (html: string): string =>
  typeof html === 'string' ?
    html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
    : html;

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
  while ((m = re.exec(html))) {
    matches.push(m.slice(0, 2));
  }
  // Deduplicate by field name
  const seen = new Set<string>();
  return matches.filter(([_, name]) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
};

// Field names referenced by a template's ${...} placeholders.
export const getTemplateFields = (html: string): string[] =>
  findTemplateFields(html).map(([, name]) => name);

/**
 * Computes the template id, (best-effort) registers it with the manager so
 * workers can fetch it, and upserts the local record. Shared by the team UI
 * and the Requestor API. Approval is sticky: once this exact HTML is approved
 * it stays approved.
 */
export const registerTemplate = async (input: {
  name: string;
  html: string;
  ownerId?: string;
  approved: boolean;
  approvalRequested?: boolean;
}): Promise<TemplateRecord> => {
  const templateId = computeTemplateId(managerId, input.html);
  const existing = (await getTemplate(templateId))?.data;

  const template: Template = {
    templateId,
    data: input.html,
    createdAt: existing?.createdAt ?? Date.now(),
  };

  // Register with the manager so workers can fetch it. Best-effort: the local
  // record is still saved if the manager is unreachable (matches prior team
  // behaviour); the worker just can't fetch it until re-registered.
  try {
    await api.post<APIResponse>("/template/register", {
      template,
      providerPeerIdStr: managerId,
    });
  } catch (e) {
    console.warn("Template manager registration failed (saved locally):", e);
  }

  const record: TemplateRecord = {
    ...template,
    name: existing?.name ?? input.name,
    status: "active",
    ownerId: existing?.ownerId ?? input.ownerId,
    approved: existing?.approved || input.approved,
    approvalRequested:
      existing?.approvalRequested || input.approvalRequested || false,
  };
  await db.set<TemplateRecord>(["templates", templateId], record);
  return record;
};

// Per-account visibility index, so a content-addressed template can be listed
// for every requestor that submitted it (without clobbering ownership).
export const addAccountTemplate = (accountId: string, templateId: string) =>
  db.set<boolean>(["account-template", accountId, templateId], true);

export const getAccountTemplateIds = async (
  accountId: string,
): Promise<string[]> =>
  (await db.listAll<boolean>(["account-template", accountId, {}])).map(
    (record) => record.key[2] as string,
  );

export const getPublicApprovedTemplates = async (): Promise<TemplateRecord[]> =>
  (await getTemplates("active"))
    .map((record) => record.data)
    .filter((tpl) => isPublicTemplate(tpl) && isTemplateApproved(tpl));

export const getPendingApprovalTemplates = async (): Promise<TemplateRecord[]> =>
  (await getTemplates())
    .map((record) => record.data)
    .filter((tpl) => tpl.approvalRequested && !tpl.approved);

export const setTemplateApproval = async (
  templateId: string,
  approved: boolean,
): Promise<TemplateRecord | null> => {
  const record = await getTemplate(templateId);
  if (!record) return null;
  record.data.approved = approved;
  if (approved) record.data.approvalRequested = false;
  await db.set<TemplateRecord>(["templates", templateId], record.data);
  return record.data;
};

export const rejectTemplateApproval = async (
  templateId: string,
): Promise<TemplateRecord | null> => {
  const record = await getTemplate(templateId);
  if (!record) return null;
  record.data.approved = false;
  record.data.approvalRequested = false;
  await db.set<TemplateRecord>(["templates", templateId], record.data);
  return record.data;
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
  id="f${name}" name="${name}" type="text">`,
).join("")}
<textarea style="display: none;" name="html">${escapeHTML(html)}</textarea>
<button type="submit">Preview</button>
</form>
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
      try {
        const record = await registerTemplate({
          name: req.body.name,
          html: req.body.html,
          approved: true, // team templates are trusted by default
        });
        console.log(`Published template ${record.templateId}`);
        msg = `<p>Success! ${record.templateId}</p>`;
      } catch (e) {
        console.log(`Errors during registration`, e);
        msg = "Error during template registration.";
        valid = false;
      }
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

${templateDataForm(html, fields, req.body)}`);
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
