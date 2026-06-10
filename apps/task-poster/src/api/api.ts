import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Express } from "express";
import { type AuthedRequest, requireApiKey } from "./accounts.js";
import { apiError, apiJson, asyncHandler } from "./api-util.js";
import { getBalance } from "./ledger.js";
import {
  addAccountTemplate,
  getAccountTemplateIds,
  getPublicApprovedTemplates,
  getTemplate,
  getTemplateFields,
  isTemplateApproved,
  registerTemplate,
  type TemplateRecord,
} from "../templates.js";

/**
 * External Requestor API, mounted under `/api/v1`. All routes are guarded by
 * `requireApiKey`, which attaches the resolved account to the request.
 *
 * Grows across phases:
 *   Phase 0 — GET /account
 *   Phase 2 — templates
 *   Phase 3 — jobs
 */
export const addRequestorApiRoutes = (app: Express): void => {
  // Public, rendered copy of API.md (client-side markdown via CDN). Embedded
  // chars are escaped so template/HTML examples can't break out of the script.
  app.get(
    "/api/docs",
    asyncHandler(async (_req, res) => {
      let markdown = "# Requestor API\n\nDocs file not found.";
      try {
        markdown = await readFile(
          fileURLToPath(new URL("./API.md", import.meta.url)),
          "utf8",
        );
      } catch {
        // fall back to the placeholder
      }
      const safe = JSON.stringify(markdown)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e");
      res.type("html").send(
        `<!doctype html><html><head><meta charset="utf-8">
<title>Effect AI — Requestor API</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{max-width:820px;margin:2rem auto;padding:0 1rem;font:16px/1.6 system-ui,sans-serif;color:#222}
pre{background:#f5f5f5;padding:1rem;overflow:auto;border-radius:8px}
code{background:#f5f5f5;padding:.1rem .35rem;border-radius:4px}
pre code{padding:0;background:none}table{border-collapse:collapse}
td,th{border:1px solid #ddd;padding:.3rem .6rem}a{color:#2563eb}</style>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script></head>
<body><div id="content">Loading…</div>
<script>document.getElementById("content").innerHTML=marked.parse(${safe});</script>
</body></html>`,
      );
    }),
  );

  app.get(
    "/api/v1/account",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const balance = await getBalance(account.id);

      apiJson(res, {
        id: account.id,
        name: account.name,
        status: account.status,
        createdAt: account.createdAt,
        credits: {
          balance: balance.toString(),
          currency: "EFFECT",
          lamportsPerEffect: 1_000_000,
        },
      });
    }),
  );

  // ------------------------------------------------------------- templates

  const templateView = (tpl: TemplateRecord, owned: boolean) => ({
    templateId: tpl.templateId,
    name: tpl.name,
    fields: getTemplateFields(tpl.data),
    approved: isTemplateApproved(tpl),
    owned,
  });

  // Available templates: the public/approved default catalog + the caller's own.
  app.get(
    "/api/v1/templates",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;

      const ownIds = new Set(await getAccountTemplateIds(account.id));
      const ownTemplates = (
        await Promise.all([...ownIds].map((id) => getTemplate(id)))
      )
        .filter((record): record is NonNullable<typeof record> => !!record)
        .map((record) => record.data);

      const byId = new Map<string, ReturnType<typeof templateView>>();
      for (const tpl of await getPublicApprovedTemplates())
        byId.set(tpl.templateId, templateView(tpl, ownIds.has(tpl.templateId)));
      for (const tpl of ownTemplates)
        byId.set(tpl.templateId, templateView(tpl, true));

      apiJson(res, { templates: [...byId.values()] });
    }),
  );

  // Submit a custom template. `requestApproval` queues it for team review;
  // either way it's usable immediately (the worker badge reflects approval).
  app.post(
    "/api/v1/templates",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const name = String(req.body?.name ?? "").trim();
      const html = String(req.body?.html ?? "");
      const requestApproval =
        req.body?.requestApproval === true ||
        req.body?.requestApproval === "true";

      if (!name)
        return apiError(res, 400, "invalid_request", "'name' is required.");
      if (!html)
        return apiError(res, 400, "invalid_request", "'html' is required.");

      const record = await registerTemplate({
        name,
        html,
        ownerId: account.id,
        approved: false,
        approvalRequested: requestApproval,
      });
      await addAccountTemplate(account.id, record.templateId);

      return apiJson(
        res,
        {
          ...templateView(record, true),
          approvalRequested: record.approvalRequested ?? false,
        },
        201,
      );
    }),
  );
};
