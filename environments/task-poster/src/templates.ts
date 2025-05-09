import { isHtmx, page } from "./html.js";
import type { Express } from "express";
import { managerId, db } from "./state.js";
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
};

const api = axios.create({
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
  baseURL: "http://localhost:8889",
});

const form = (msg = "", values: Record<string, string> = {}): string => `
<form id="main-form" hx-post="/t/create">
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

    <button type="submit">Save</button>
  </fieldset>
</form>
`;

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

    if (valid) {
      const templateId = computeTemplateId(managerId, req.body.html);

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

        const templateEntry = { ...template, name: req.body.name };
        await db.set(["templates", templateId], templateEntry);

        msg = `<p>Success! ${data.status}:</p><p>${data.id}</p>`;
      } catch (e) {
        msg = "Error during template registration.";
        valid = false;
      }
    }

    if (valid) {
      res.send(`
<div id="main-form" hx-swap-oob="true">
  <blockquote>${msg}</blockquote>
  <p><a href="/m/${managerId}"><button>Home</button></a></p>
</div>
`);
    } else {
      console.log(req.params);
      res.send(form(msg, req.body));
    }
  });
};
