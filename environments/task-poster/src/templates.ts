import { isHtmx, page } from "./html.js";
import type { Express } from "express";
import { managerId, db } from "./state.js";
import * as state from "./state.js";
import axios from "axios";
import { type Template, computeTemplateId } from "@effectai/protocol";

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

const escapeHTML = (html: string): string =>
  html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const getTemplates = async () =>
  await db.listAll<TemplateRecord>(["templates", {}]);
export const getTemplate = async (id: string) =>
  await db.get<TemplateRecord>(["templates", id]);

export const renderTemplate = async (
  html: string,
  data: any,
): Promise<string> => {
  const templateHtml = html.replace(
    /\$\{([^}]+)\}/g,
    (_: any, key: any) => {
      const keyName = key.trim();
      const rawValue = data[keyName];
      if (rawValue === undefined) return "";
      const escapedValue =
	typeof rawValue === "string"
	  ? rawValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
	  : rawValue;
      return escapedValue;
    },
  );

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
      rows="10">${values.html || ""}</textarea>

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
<textarea style="display: none;" name="html">${html}</textarea>
<button type="submit">Preview</button>
</form>
`,
)}
`;

const templatePreviewFrame =
  async (html: string, data: Record<string, string> = {}) => {
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


export const addTemplateRoutes = (app: Express): void => {
  app.get("/t/create", (_req, res) => {
    res.send(page(form()));
  });

  app.post("/t/create", async (req, res) => {
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
      console.log(`Publishing new template ${templateId}...`)

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

      const templateEntry = {
	...template, name: req.body.name, status: "draft"
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
    <textarea style="display: none;" name="html">${req.body.html}</textarea>
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


  app.get("/t/test/:id", async (req, res) => {
    const tid = req.params.id;
    const tpl = await getTemplate(tid);
    if (!tpl) {
      res.status(404);
      res.send('not found');
      res.end();
      return;
    }
    res.send(
      page(`<strong>Template ${tpl?.data.name}</strong>
${await templatePreviewFrame(tpl!.data.data)}
`));
  });

  app.post("/t/test", async (req, res) => {
    // const tid = req.params.tid;
    // const tpl = await getTemplate(tid);
    const html = req.body.html;

    if (!html) {
      res.status(404);
      res.send('not found');
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
};
