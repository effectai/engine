import type { Express } from "express";
import {
  type Account,
  type ApiKeyRecord,
  createAccount,
  getAccount,
  issueApiKey,
  listAccounts,
  listApiKeys,
  revokeApiKey,
} from "./accounts.js";
import { effectToLamports, lamportsToEffect } from "./api-util.js";
import { requireAuth } from "../auth.js";
import { make404, page } from "../html.js";
import { deleteAccountAndData } from "./jobs.js";
import { credit, getBalance } from "./ledger.js";
import {
  escapeHTML,
  getPendingApprovalTemplates,
  getTemplate,
  getTemplateFields,
  rejectTemplateApproval,
  renderTemplate,
  setTemplateApproval,
  type TemplateRecord,
} from "../templates.js";

/**
 * Team-only admin UI for the Requestor API (cookie auth, HTMX — matches the
 * rest of the task-poster). Lets the team create accounts, issue API keys,
 * and manually top up credit balances until on-chain buying exists.
 */

const keyRow = (key: ApiKeyRecord): string => `
  <li style="display:flex;align-items:center;gap:0.5rem;justify-content:space-between">
    <code>${escapeHTML(key.prefix)}</code>
    <span>
      <small style="color:${key.status === "active" ? "var(--accent)" : "#c0392b"}">${key.status}</small>
      ${
        key.status === "active"
          ? `<button style="padding:0.1rem 0.5rem;margin-left:0.5rem"
               hx-post="/admin/keys/${key.hash}/revoke"
               hx-confirm="Revoke this key? Apps using it will stop working.">Revoke</button>`
          : ""
      }
    </span>
  </li>`;

const accountCard = (
  account: Account,
  balance: bigint,
  keys: ApiKeyRecord[],
): string => `
<div class="box account-card" style="text-align:left;width:100%"
     data-search="${escapeHTML(`${account.name} ${account.id}`.toLowerCase())}">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem">
    <strong>${escapeHTML(account.name)}</strong>
    <span style="display:flex;align-items:center;gap:0.6rem">
      <small>${account.status}</small>
      <button style="padding:0.1rem 0.5rem"
        hx-post="/admin/accounts/${account.id}/delete"
        hx-confirm="Delete account &quot;${escapeHTML(account.name)}&quot;? This permanently removes its API keys, credit balance and jobs (any running tasks are stopped). This cannot be undone.">Delete</button>
    </span>
  </div>
  <small style="opacity:0.7">${account.id}</small>

  <p style="margin:0.5rem 0"><strong>${lamportsToEffect(balance)} EFFECT</strong>
    <small>(${balance.toString()} lamports)</small></p>

  <form hx-post="/admin/accounts/${account.id}/credits"
        style="display:flex;flex-wrap:wrap;gap:0.4rem;align-items:center;margin:0.5rem 0">
    <input name="amount" type="text" placeholder="EFFECT amount" style="margin:0;width:7rem;flex:0 0 auto" />
    <input name="note" type="text" placeholder="note (optional)" style="margin:0;width:10rem;flex:1 1 auto" />
    <button type="submit" style="margin:0;flex:0 0 auto">Top up</button>
  </form>

  <details>
    <summary><small>API keys (${keys.filter((key) => key.status === "active").length} active)</small></summary>
    <ul style="list-style:none;padding:0">
      ${keys.length ? keys.map(keyRow).join("") : "<li><small>No keys yet.</small></li>"}
    </ul>
    <button hx-post="/admin/accounts/${account.id}/keys"
            hx-target="#key-reveal-${account.id}" hx-swap="innerHTML">+ Issue new key</button>
    <div id="key-reveal-${account.id}"></div>
  </details>
</div>`;

const renderAccountsPage = async (): Promise<string> => {
  const accounts = await listAccounts();
  const cards = await Promise.all(
    accounts
      .sort((first, second) => second.createdAt - first.createdAt)
      .map(async (account) =>
        accountCard(
          account,
          await getBalance(account.id),
          await listApiKeys(account.id),
        ),
      ),
  );

  return `
<div id="page">
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <h2>API Accounts</h2>
    <nav style="display:flex;gap:0.5rem">
      <a href="/api-console.html" target="_blank"><button>API console</button></a>
      <a href="/api/docs" target="_blank"><button>API docs</button></a>
      <a href="/admin/templates/pending"><button>Template approvals</button></a>
    </nav>
  </div>
  <p><small>Requestor accounts for the external API. Top-ups are manual until on-chain buying ships.</small></p>

  <form hx-post="/admin/accounts" class="box" style="display:flex;gap:0.5rem;align-items:center">
    <input name="name" type="text" placeholder="New account name" style="margin:0;flex:1" required />
    <button type="submit" style="margin:0">+ Create account</button>
  </form>

  ${
    cards.length
      ? `<div style="display:flex;gap:0.5rem;align-items:center;margin-top:1rem">
    <input id="acct-search" type="text" placeholder="Search by name or ID" style="margin:0;flex:1" />
    <small id="acct-count" style="white-space:nowrap;opacity:0.7"></small>
  </div>`
      : ""
  }

  <div id="accounts-list" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem">
    ${cards.length ? cards.join("") : "<p><small>No accounts yet.</small></p>"}
  </div>

  <div id="accounts-pager" style="display:flex;gap:0.5rem;align-items:center;justify-content:center;margin-top:1rem"></div>
</div>
<script>
(() => {
  const PAGE_SIZE = 5;
  const list = document.getElementById("accounts-list");
  if (!list) return;
  const cards = Array.from(list.querySelectorAll(".account-card"));
  const search = document.getElementById("acct-search");
  const count = document.getElementById("acct-count");
  const pager = document.getElementById("accounts-pager");
  let currentPage = 1;

  const filtered = () => {
    const query = (search?.value ?? "").trim().toLowerCase();
    return cards.filter(
      (card) => !query || (card.dataset.search ?? "").includes(query),
    );
  };

  const render = () => {
    const matches = filtered();
    const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    if (currentPage > pageCount) currentPage = pageCount;
    const start = (currentPage - 1) * PAGE_SIZE;
    const visible = new Set(matches.slice(start, start + PAGE_SIZE));

    for (const card of cards) {
      card.style.display = visible.has(card) ? "" : "none";
    }

    if (count) {
      count.textContent = matches.length
        ? matches.length + " account" + (matches.length === 1 ? "" : "s")
        : "no matches";
    }

    pager.innerHTML = "";
    if (matches.length > PAGE_SIZE) {
      const button = (label, page, disabled) => {
        const element = document.createElement("button");
        element.textContent = label;
        element.disabled = disabled;
        element.style.padding = "0.2rem 0.6rem";
        element.onclick = () => {
          currentPage = page;
          render();
        };
        return element;
      };
      pager.appendChild(button("‹ Prev", currentPage - 1, currentPage <= 1));
      const label = document.createElement("small");
      label.textContent = "Page " + currentPage + " / " + pageCount;
      pager.appendChild(label);
      pager.appendChild(
        button("Next ›", currentPage + 1, currentPage >= pageCount),
      );
    }
  };

  search?.addEventListener("input", () => {
    currentPage = 1;
    render();
  });
  render();
})();
</script>`;
};

const formatTimestamp = (ts: number): string =>
  new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// List card — metadata only, no inline preview. The actual (untrusted) template
// is rendered on its own full-screen review page, reached via "Review".
const pendingTemplateCard = async (tpl: TemplateRecord): Promise<string> => {
  const owner = tpl.ownerId ? await getAccount(tpl.ownerId) : null;
  const fields = getTemplateFields(tpl.data);
  const sizeKb = (tpl.data.length / 1024).toFixed(1);
  return `
<div class="box tpl-card" style="text-align:left;width:100%;padding:1.1rem;display:flex;align-items:center;gap:1rem">
  <div style="flex:1;min-width:0">
    <div style="display:flex;align-items:baseline;gap:0.5rem;flex-wrap:wrap">
      <strong>${escapeHTML(tpl.name || "[no name]")}</strong>
      <small style="opacity:0.7">by ${owner ? escapeHTML(owner.name) : "unknown"}</small>
    </div>
    <small style="opacity:0.6;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHTML(tpl.templateId)}</small>
    <div style="display:flex;flex-wrap:wrap;gap:0.3rem 1.5rem;margin-top:0.55rem;font-size:0.85rem">
      <span><small style="opacity:0.6">Submitted </small>${escapeHTML(formatTimestamp(tpl.createdAt))}</span>
      <span><small style="opacity:0.6">Size </small>${sizeKb} KB</span>
      <span><small style="opacity:0.6">Fields </small>${
        fields.length
          ? fields.map((field) => `<code>${escapeHTML(field)}</code>`).join(", ")
          : "none"
      }</span>
    </div>
  </div>
  <a href="/admin/templates/${encodeURIComponent(tpl.templateId)}/review" style="flex:0 0 auto;display:inline-flex"><button class="filled">Review →</button></a>
</div>`;
};

// Client-side pager: shows 5 cards at a time (matches the accounts page).
const templatePagerScript = `
<script>
(() => {
  const PAGE_SIZE = 5;
  const list = document.getElementById("tpl-list");
  if (!list) return;
  const cards = Array.from(list.querySelectorAll(".tpl-card"));
  const pager = document.getElementById("tpl-pager");
  let currentPage = 1;
  const render = () => {
    const pageCount = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
    if (currentPage > pageCount) currentPage = pageCount;
    const start = (currentPage - 1) * PAGE_SIZE;
    cards.forEach((card, index) => {
      card.style.display = index >= start && index < start + PAGE_SIZE ? "" : "none";
    });
    pager.innerHTML = "";
    if (cards.length > PAGE_SIZE) {
      const button = (label, page, disabled) => {
        const element = document.createElement("button");
        element.textContent = label;
        element.disabled = disabled;
        element.style.padding = "0.2rem 0.6rem";
        element.onclick = () => { currentPage = page; render(); };
        return element;
      };
      pager.appendChild(button("‹ Prev", currentPage - 1, currentPage <= 1));
      const label = document.createElement("small");
      label.textContent = "Page " + currentPage + " / " + pageCount;
      pager.appendChild(label);
      pager.appendChild(button("Next ›", currentPage + 1, currentPage >= pageCount));
    }
  };
  render();
})();
</script>`;

const renderPendingPage = async (): Promise<string> => {
  const pending = (await getPendingApprovalTemplates()).sort(
    (first, second) => second.createdAt - first.createdAt,
  );
  const cards = await Promise.all(pending.map(pendingTemplateCard));
  return `
<div id="page">
  <div style="display:flex;justify-content:space-between;align-items:baseline">
    <h2>Template Approvals <small>(${pending.length} pending)</small></h2>
    <nav style="display:flex;gap:0.5rem">
      <a href="/admin/accounts"><button>API accounts</button></a>
    </nav>
  </div>
  <p><small>Custom templates requestors submitted for review. Open
    <strong>Review</strong> to see a template full-screen exactly as a worker
    would, then approve or reject it there.</small></p>

  <div id="tpl-list" style="display:flex;flex-direction:column;gap:1rem;margin-top:1rem">
    ${cards.length ? cards.join("") : "<p><small>Nothing pending.</small></p>"}
  </div>

  <div id="tpl-pager" style="display:flex;gap:0.5rem;align-items:center;justify-content:center;margin-top:1rem"></div>
</div>
${templatePagerScript}`;
};

// Full-screen review of a single template, rendered the way a worker sees it.
// These templates are UNTRUSTED, so the iframe runs scripts in a hardened
// sandbox WITHOUT `allow-same-origin` — the frame gets an opaque origin and
// cannot read the admin's cookies/session or touch the parent document (the
// worker platform isolates the same content on a cross-origin proxy iframe,
// see apps/worker-app/app/components/TaskTemplate.vue).
const renderTemplateReviewPage = async (
  tpl: TemplateRecord,
): Promise<string> => {
  const owner = tpl.ownerId ? await getAccount(tpl.ownerId) : null;
  const fields = getTemplateFields(tpl.data);
  // Populate each ${field} with its own name so the reviewer can see where the
  // fields render (a real task supplies row data here).
  const sampleData = Object.fromEntries(fields.map((field) => [field, field]));
  const rendered = await renderTemplate(tpl.data, sampleData);
  const id = encodeURIComponent(tpl.templateId);
  return `
<div style="max-width:1200px;margin:0 auto;padding:1rem">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;flex-wrap:wrap">
    <div>
      <h2 style="margin:0 0 0.2rem">${escapeHTML(tpl.name || "[no name]")}</h2>
      <small style="opacity:0.7">by ${owner ? escapeHTML(owner.name) : "unknown"} · ${escapeHTML(formatTimestamp(tpl.createdAt))}</small>
    </div>
    <div class="button-bar">
      <a href="/admin/templates/pending"><button>← Back</button></a>
      <button class="filled" hx-post="/admin/templates/${id}/approve">✓ Approve</button>
      <button hx-post="/admin/templates/${id}/reject"
              hx-confirm="Reject this template?">Reject</button>
    </div>
  </div>

  <p style="margin:0.6rem 0 0.2rem"><small style="opacity:0.6">${escapeHTML(tpl.templateId)}</small></p>
  <p style="margin:0.2rem 0"><small>Fields: ${
    fields.length
      ? fields.map((field) => `<code>${escapeHTML(field)}</code>`).join(", ")
      : "none"
  }</small></p>

  <div style="margin:0.5rem 0;background:rgba(230,161,83,0.12);border:1px solid #e6a153;border-radius:8px;padding:0.5rem 0.75rem">
    <small>⚠ Untrusted template — scripts run in a hardened sandbox (no same-origin access). Review the layout and behaviour carefully before approving.</small>
  </div>

  <iframe sandbox="allow-scripts allow-modals allow-forms allow-popups allow-pointer-lock"
    srcdoc="${escapeHTML(rendered)}"
    allow="geolocation; microphone; camera; autoplay; fullscreen"
    style="width:100%;height:calc(100dvh - 320px);min-height:440px;margin-top:0.5rem;border:3px solid #616060;border-radius:8px;background:#fff"></iframe>
</div>`;
};

export const addAdminRoutes = (app: Express): void => {
  app.get("/admin/accounts", requireAuth, async (_req, res) => {
    res.send(page(await renderAccountsPage()));
  });

  app.post("/admin/accounts", requireAuth, async (req, res) => {
    const name = String(req.body.name ?? "").trim();
    if (!name) {
      res.status(400).send("Account name is required");
      return;
    }
    await createAccount(name);
    res.setHeader("HX-Location", "/admin/accounts");
    res.end();
  });

  app.post("/admin/accounts/:id/credits", requireAuth, async (req, res) => {
    const account = await getAccount(req.params.id);
    if (!account) return make404(res);

    try {
      const lamports = effectToLamports(req.body.amount ?? "");
      if (lamports <= 0n) throw new Error("Amount must be greater than 0");
      await credit(account.id, lamports, {
        note: String(req.body.note ?? "manual top-up"),
      });
      res.setHeader("HX-Location", "/admin/accounts");
      res.end();
    } catch (err) {
      res
        .status(400)
        .send(`<blockquote>Could not top up: ${escapeHTML(String(err))}</blockquote>`);
    }
  });

  app.post("/admin/accounts/:id/delete", requireAuth, async (req, res) => {
    const account = await getAccount(req.params.id);
    if (!account) return make404(res);
    await deleteAccountAndData(account.id);
    res.setHeader("HX-Location", "/admin/accounts");
    res.end();
  });

  app.post("/admin/accounts/:id/keys", requireAuth, async (req, res) => {
    const account = await getAccount(req.params.id);
    if (!account) return make404(res);

    const { key } = await issueApiKey(account.id);
    // Shown ONCE — there is no way to recover it later.
    res.send(`
<div class="box" style="border:1px solid var(--accent);margin-top:0.5rem">
  <strong>New API key — copy it now, it won't be shown again:</strong>
  <p><code style="word-break:break-all">${escapeHTML(key)}</code></p>
</div>`);
  });

  app.post("/admin/keys/:hash/revoke", requireAuth, async (req, res) => {
    await revokeApiKey(req.params.hash);
    res.setHeader("HX-Location", "/admin/accounts");
    res.end();
  });

  // ----------------------------------------------------- template approvals

  app.get("/admin/templates/pending", requireAuth, async (_req, res) => {
    res.send(page(await renderPendingPage()));
  });

  // Full-screen review of one template. Rendered full-width (empty bodyClass)
  // so the preview iframe isn't capped by the 800px `.container`.
  app.get("/admin/templates/:id/review", requireAuth, async (req, res) => {
    const record = await getTemplate(req.params.id);
    if (!record) return make404(res);
    res.send(page(await renderTemplateReviewPage(record.data), ""));
  });

  app.post("/admin/templates/:id/approve", requireAuth, async (req, res) => {
    await setTemplateApproval(req.params.id, true);
    res.setHeader("HX-Location", "/admin/templates/pending");
    res.end();
  });

  app.post("/admin/templates/:id/reject", requireAuth, async (req, res) => {
    await rejectTemplateApproval(req.params.id);
    res.setHeader("HX-Location", "/admin/templates/pending");
    res.end();
  });
};
