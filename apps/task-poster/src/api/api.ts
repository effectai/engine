import type { Express, Request, Response } from "express";
import {
  type Account,
  type ApiKeyRecord,
  type AuthedRequest,
  checkSignupRateLimit,
  countActiveApiKeys,
  createAccount,
  getAccountFromRequest,
  getApiKey,
  issueApiKey,
  listApiKeys,
  requireApiKey,
  revokeApiKey,
  updateAccount,
} from "./accounts.js";
import {
  apiError,
  apiJson,
  asyncHandler,
  isValidEmail,
  parsePagination,
} from "./api-util.js";
import { countLedgerEntries, getBalance, listLedgerEntries } from "./ledger.js";
import { requestableCapabilities } from "@effectai/capabilities";
import { hasAuth } from "../auth.js";
import {
  addAccountTemplate,
  archiveTemplate,
  getAccountTemplateIds,
  getPublicApprovedTemplates,
  getTemplate,
  getTemplateFields,
  isTemplateApproved,
  registerTemplate,
  renderTemplate,
  type TemplateRecord,
} from "../templates.js";

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 320;
// Workers download the template for every task, so keep it light.
const MAX_TEMPLATE_HTML_BYTES = 256 * 1024;

export const addRequestorApiRoutes = (app: Express): void => {
  app.post(
    "/api/v1/signup",
    asyncHandler(async (req, res) => {
      const ip = req.ip ?? "unknown";
      if (!checkSignupRateLimit(ip)) {
        return apiError(
          res,
          429,
          "rate_limited",
          "Too many signups from this IP. Try again tomorrow.",
        );
      }

      const name = String(req.body?.name ?? "").trim();
      const email = String(req.body?.email ?? "").trim() || undefined;

      if (!name)
        return apiError(res, 400, "invalid_request", "'name' is required.");
      if (name.length > MAX_NAME_LENGTH)
        return apiError(
          res,
          400,
          "invalid_request",
          `'name' must be ${MAX_NAME_LENGTH} characters or fewer.`,
        );
      if (
        email !== undefined &&
        (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email))
      )
        return apiError(
          res,
          400,
          "invalid_request",
          "'email' must be a valid email address.",
        );

      const account = await createAccount(name, email);
      const { key } = await issueApiKey(account.id);
      return apiJson(res, { key, accountId: account.id, name: account.name }, 201);
    }),
  );

  const accountView = (account: Account, balance: bigint) => ({
    id: account.id,
    name: account.name,
    email: account.email ?? null,
    status: account.status,
    createdAt: account.createdAt,
    credits: {
      balance: balance.toString(),
      currency: "EFFECT",
      lamportsPerEffect: 1_000_000,
    },
  });

  app.get(
    "/api/v1/account",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      apiJson(res, accountView(account, await getBalance(account.id)));
    }),
  );

  app.patch(
    "/api/v1/account",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const changes: { name?: string; email?: string } = {};

      if (req.body?.name !== undefined) {
        const name = String(req.body.name).trim();
        if (!name)
          return apiError(res, 400, "invalid_request", "'name' cannot be empty.");
        if (name.length > MAX_NAME_LENGTH)
          return apiError(
            res,
            400,
            "invalid_request",
            `'name' must be ${MAX_NAME_LENGTH} characters or fewer.`,
          );
        changes.name = name;
      }
      if (req.body?.email !== undefined) {
        const email = String(req.body.email).trim();
        // "" is allowed: it clears the stored email.
        if (email && (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)))
          return apiError(
            res,
            400,
            "invalid_request",
            "'email' must be a valid email address (or \"\" to clear it).",
          );
        changes.email = email;
      }

      if (changes.name === undefined && changes.email === undefined)
        return apiError(
          res,
          400,
          "invalid_request",
          "Provide 'name' and/or 'email' to update.",
        );

      const updated = await updateAccount(account.id, changes);
      return apiJson(res, accountView(updated, await getBalance(updated.id)));
    }),
  );

  // ------------------------------------------------------------------- keys

  const keyView = (key: ApiKeyRecord) => ({
    hash: key.hash,
    prefix: key.prefix,
    status: key.status,
    createdAt: key.createdAt,
  });

  app.get(
    "/api/v1/keys",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const keys = (await listApiKeys(account.id))
        .sort((first, second) => second.createdAt - first.createdAt)
        .map(keyView);
      return apiJson(res, { keys, total: keys.length });
    }),
  );

  app.post(
    "/api/v1/keys",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      // TEMPORARY: cap each account at a single active key. Multiple keys are
      // supported end-to-end (issue/list/revoke) but intentionally gated off
      // for now. To unlock, delete this guard.
      if ((await countActiveApiKeys(account.id)) >= 1)
        return apiError(
          res,
          403,
          "forbidden",
          "Multiple API keys are not yet available. Revoke your existing key before issuing a new one.",
        );
      const { key, record } = await issueApiKey(account.id);
      return apiJson(res, { key, ...keyView(record) }, 201);
    }),
  );

  app.delete(
    "/api/v1/keys/:hash",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const record = await getApiKey(req.params.hash);
      // Scope strictly to the caller; never reveal another account's key hashes.
      if (!record || record.accountId !== account.id)
        return apiError(res, 404, "not_found", "API key not found.");
      if (record.status === "revoked")
        return apiJson(res, keyView(record)); // already revoked — idempotent

      // Revoking the LAST active key locks the account out of the API (a valid
      // key is needed to issue a new one). Allowed, but require an explicit
      // typed confirmation so it can't happen by accident.
      if ((await countActiveApiKeys(account.id)) <= 1) {
        const confirm = String(req.query.confirm ?? req.body?.confirm ?? "");
        if (confirm !== "DELETE")
          return apiError(
            res,
            400,
            "invalid_request",
            "This is your last active API key; revoking it locks you out of the API. Re-send with confirm=DELETE to proceed.",
          );
      }

      await revokeApiKey(record.hash);
      return apiJson(res, keyView({ ...record, status: "revoked" }));
    }),
  );

  // ---------------------------------------------------------- credit history

  app.get(
    "/api/v1/credits/transactions",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const { limit, offset } = parsePagination(req.query);
      const entries = await listLedgerEntries(account.id, limit, offset);

      return apiJson(res, {
        transactions: entries.map((entry) => ({
          id: entry.id,
          type: entry.type,
          amount: entry.amount, // lamports (string), like GET /account's balance
          balanceAfter: entry.balanceAfter,
          jobId: entry.jobId,
          note: entry.note,
          timestamp: entry.timestamp,
        })),
        total: countLedgerEntries(account.id),
        limit,
        offset,
        currency: "EFFECT",
        lamportsPerEffect: 1_000_000,
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

  // Single-template view: list fields + lifecycle metadata. Intentionally omits
  // the raw HTML (use `/templates/:id/preview` to render it sandboxed).
  const templateDetailView = (tpl: TemplateRecord, owned: boolean) => ({
    ...templateView(tpl, owned),
    status: tpl.status,
    approvalRequested: tpl.approvalRequested ?? false,
    createdAt: tpl.createdAt,
  });

  // Available templates: the public/approved default catalog + the caller's own
  // (archived ones excluded), newest first, paginated.
  app.get(
    "/api/v1/templates",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const { limit, offset } = parsePagination(req.query);

      const ownIds = new Set(await getAccountTemplateIds(account.id));
      const ownTemplates = (
        await Promise.all([...ownIds].map((id) => getTemplate(id)))
      )
        .filter((record): record is NonNullable<typeof record> => !!record)
        .map((record) => record.data);

      // Merge catalog + own templates (own entries win the dedup).
      const byId = new Map<string, TemplateRecord>();
      for (const tpl of await getPublicApprovedTemplates())
        byId.set(tpl.templateId, tpl);
      for (const tpl of ownTemplates) byId.set(tpl.templateId, tpl);

      const all = [...byId.values()]
        .filter((tpl) => tpl.status !== "archived")
        .sort((first, second) => second.createdAt - first.createdAt);
      const page = all
        .slice(offset, offset + limit)
        .map((tpl) => templateView(tpl, ownIds.has(tpl.templateId)));

      apiJson(res, { templates: page, total: all.length, limit, offset });
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
      if (name.length > MAX_NAME_LENGTH)
        return apiError(
          res,
          400,
          "invalid_request",
          `'name' must be ${MAX_NAME_LENGTH} characters or fewer.`,
        );
      if (!html)
        return apiError(res, 400, "invalid_request", "'html' is required.");
      if (Buffer.byteLength(html, "utf8") > MAX_TEMPLATE_HTML_BYTES)
        return apiError(
          res,
          400,
          "invalid_request",
          `'html' must be ${MAX_TEMPLATE_HTML_BYTES / 1024} KB or smaller.`,
        );

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

  // Rendered preview of a usable template. By default each ${field} is filled
  // with its own name (same sample approach as the admin review page); POST
  // additionally accepts `data` with caller-supplied sample values, so
  // templates that expect real shapes (image URLs, JSON strings) can be
  // previewed working. Provided values merge over the defaults; unknown fields
  // are ignored. Returns the rendered HTML, which the console drops into a
  // sandboxed iframe; the template itself may be untrusted.
  const handleTemplatePreview = asyncHandler(async (req, res) => {
    const { account } = req as AuthedRequest;
    const record = await getTemplate(req.params.id);
    if (!record) return apiError(res, 404, "not_found", "Template not found.");

    // Same access rule as job creation: approved (public catalog) or owned.
    const approved = isTemplateApproved(record.data);
    const owned = (await getAccountTemplateIds(account.id)).includes(
      record.data.templateId,
    );
    // 404 (not 403): template ids are content hashes, so a 403 would confirm
    // to a non-owner that someone has registered that exact HTML.
    if (!approved && !owned)
      return apiError(res, 404, "not_found", "Template not found.");

    const fields = getTemplateFields(record.data.data);
    const sampleData: Record<string, string | number | boolean> =
      Object.fromEntries(fields.map((field) => [field, field]));

    const provided = req.body?.data;
    if (provided !== undefined) {
      if (
        typeof provided !== "object" ||
        provided === null ||
        Array.isArray(provided)
      )
        return apiError(
          res,
          400,
          "invalid_request",
          "'data' must be an object mapping field names to sample values.",
        );
      for (const [field, value] of Object.entries(provided)) {
        if (!fields.includes(field)) continue;
        const valueType = typeof value;
        if (
          valueType !== "string" &&
          valueType !== "number" &&
          valueType !== "boolean"
        )
          return apiError(
            res,
            400,
            "invalid_request",
            `Sample value for '${field}' must be a string, number, or boolean.`,
          );
        sampleData[field] = value as string | number | boolean;
      }
    }

    const html = await renderTemplate(record.data.data, sampleData);

    return apiJson(res, {
      templateId: record.data.templateId,
      name: record.data.name,
      fields,
      approved,
      // Echo the values actually rendered so clients can prefill their form.
      sampleData,
      html,
    });
  });

  app.get("/api/v1/templates/:id/preview", requireApiKey, handleTemplatePreview);
  app.post("/api/v1/templates/:id/preview", requireApiKey, handleTemplatePreview);

  // Single template (metadata only — no raw HTML). Access: approved (public
  // catalog) or owned, matching `/preview` and job creation.
  app.get(
    "/api/v1/templates/:id",
    requireApiKey,
    asyncHandler(async (req, res) => {
      const { account } = req as AuthedRequest;
      const record = await getTemplate(req.params.id);
      if (!record)
        return apiError(res, 404, "not_found", "Template not found.");

      const owned = (await getAccountTemplateIds(account.id)).includes(
        record.data.templateId,
      );
      // Same 404-over-403 rule as /preview: don't confirm the id exists.
      if (!isTemplateApproved(record.data) && !owned)
        return apiError(res, 404, "not_found", "Template not found.");

      return apiJson(res, templateDetailView(record.data, owned));
    }),
  );

  // Retire a template (soft archive: drops from listings + blocks new jobs,
  // existing jobs keep running). Authorized for the template's owner (via API
  // key) OR a logged-in team admin (cookie session), who may archive any
  // template. Public-catalog templates can't be retired by requestors.
  app.delete(
    "/api/v1/templates/:id",
    asyncHandler(async (req, res) => {
      const isAdmin = hasAuth(req);
      const account = await getAccountFromRequest(req);
      if (!isAdmin && !account)
        return apiError(
          res,
          401,
          "unauthorized",
          "Missing API key. Send it as 'Authorization: Bearer <key>'.",
        );

      const record = await getTemplate(req.params.id);
      if (!record)
        return apiError(res, 404, "not_found", "Template not found.");

      const owns = !!account && record.data.ownerId === account.id;
      if (!isAdmin && !owns) {
        // If the caller can't even see the template (unapproved, not theirs),
        // 404 like the read endpoints so its existence isn't confirmed. A 403
        // is fine for approved templates: the catalog is public anyway.
        if (!isTemplateApproved(record.data))
          return apiError(res, 404, "not_found", "Template not found.");
        return apiError(
          res,
          403,
          "forbidden",
          "Only the template's owner or the Effect team can delete it.",
        );
      }

      const archived = await archiveTemplate(record.data.templateId);
      return apiJson(res, templateDetailView(archived ?? record.data, owns));
    }),
  );

  // ---------------------------------------------------------- capabilities

  // The closed vocabulary for POST /jobs' `capability` field. Clients should
  // build their pickers from this list instead of hard-coding ids; anything
  // not in it is rejected at job creation. Only requestor-relevant fields are
  // exposed — the registry's marketplace fields (cost, earnings, …) stay
  // internal.
  const capabilityView = requestableCapabilities.map((capability) => ({
    id: capability.id,
    name: capability.name,
    category: capability.category,
    description: capability.description,
  }));
  app.get("/api/v1/capabilities", requireApiKey, (_req: Request, res: Response) => {
    apiJson(res, {
      capabilities: capabilityView,
      total: capabilityView.length,
    });
  });

  // Health check endpoint: unauthenticated ping for integrators and load balancers.
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    apiJson(res, {
      status: "ok",
      uptimeMs: Math.round(process.uptime() * 1000),
      timestamp: new Date().toISOString(),
    });
  });

};
