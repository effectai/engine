import { api, setApiKey, hasApiKey, fetchResultsCsv } from "./client.js";

// ------------------------------------------------------------------ state
let templates = [];
let jobsCache = [];
let openJobId = null;      // currently expanded job row
let drawerResults = [];    // results currently loaded in the drawer
let drawerJobId = null;

// ------------------------------------------------------------------ helpers
const byId = (elementId) => document.getElementById(elementId);
const esc = (value) => String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
const shortId = (value) => (value || "").slice(0, 10) + "…";
const effectFromLamports = (lamports) => Number(lamports) / 1e6;

function showMsg(element, text, kind) {
  element.innerHTML = `<div class="msg ${kind}">${esc(text)}</div>`;
}

function relativeTime(timestamp) {
  const seconds = Math.floor((Date.now() - Number(timestamp)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + "d ago";
  return new Date(Number(timestamp)).toLocaleDateString();
}

// ------------------------------------------------------------------ theme
// The theme preference is persisted (non-sensitive). The API key is still
// never stored, so a reload always returns to the signup view.
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  byId("icon-sun").classList.toggle("hide", theme === "dark");
  byId("icon-moon").classList.toggle("hide", theme !== "dark");
}
function toggleTheme() {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  localStorage.setItem("effect-console-theme", next);
  applyTheme(next);
}
applyTheme(localStorage.getItem("effect-console-theme") || "light");

// ------------------------------------------------------------------ tabs
function showTab(name) {
  document.querySelectorAll(".tab").forEach((tabButton) => tabButton.classList.toggle("active", tabButton.dataset.tab === name));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("hide", panel.id !== "panel-" + name));
}

function setConnected(isConnected) {
  document.querySelectorAll(".tab").forEach((tabButton) => { tabButton.disabled = !isConnected; });
  byId("app-view").classList.toggle("hide", !isConnected);
  byId("signup-view").classList.toggle("hide", isConnected);
  byId("connect-wrap").classList.toggle("hide", isConnected);
  byId("status-connected").classList.toggle("hide", !isConnected);
  byId("disconnect").classList.toggle("hide", !isConnected);
}

// ------------------------------------------------------------------ connect
async function connect() {
  const typed = byId("key").value.trim();
  if (typed) setApiKey(typed);
  if (!hasApiKey()) { setConnected(false); return; }
  try {
    const account = await loadAccount();
    setConnected(true);
    byId("key").value = "";
    byId("status-text").textContent = account.name || "Connected";
    showTab("overview");
    await Promise.all([loadTemplates(), loadJobs(), loadKeys()]);
    await loadOverview();
  } catch (error) {
    setConnected(false);
    showMsg(byId("signup-msg"), "Could not connect: " + error.message, "err");
  }
}

function disconnect() {
  // No key persistence: the key lives only in memory, so reloading returns to signup.
  location.reload();
}

// ------------------------------------------------------------------ account
async function loadAccount() {
  const account = await api("/account");
  byId("acct-name").value = account.name || "";
  byId("acct-email").value = account.email || "";
  byId("acct-balance").textContent = effectFromLamports(account.credits.balance).toLocaleString();
  byId("acct-lamports").textContent = "≈ " + Number(account.credits.balance).toLocaleString() + " lamports";
  return account;
}

async function saveAccount() {
  try {
    await api("/account", { method: "PATCH", body: { name: byId("acct-name").value.trim(), email: byId("acct-email").value.trim() } });
    showMsg(byId("acct-msg"), "Saved.", "ok");
    await Promise.all([loadAccount(), loadKeyMini()]);
    byId("status-text").textContent = byId("acct-name").value.trim() || "Connected";
  } catch (error) { showMsg(byId("acct-msg"), error.message, "err"); }
}

async function loadTransactions() {
  byId("tx-list").innerHTML = "Loading…";
  try {
    const { transactions, total } = await api("/credits/transactions?limit=50");
    if (!transactions.length) { byId("tx-list").innerHTML = `<span class="muted">No transactions yet. Ask the team to top up your credits.</span>`; return; }
    byId("tx-list").innerHTML =
      `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance</th><th>Note</th></tr></thead><tbody>` +
      transactions.map((transaction) => {
        // `amount` is always positive; the type carries the direction.
        const amount = effectFromLamports(transaction.amount);
        const isDebit = transaction.type === "debit";
        return `<tr>
          <td class="muted">${esc(new Date(transaction.timestamp).toLocaleString())}</td>
          <td><span class="pill ${isDebit ? "pill-warn" : "pill-ok"}">${esc(transaction.type)}</span></td>
          <td class="mono" style="color:${isDebit ? "var(--danger-fg)" : "var(--ok-fg)"}">${isDebit ? "-" : "+"}${amount} EFFECT</td>
          <td class="mono">${effectFromLamports(transaction.balanceAfter)}</td>
          <td class="muted">${esc(transaction.note || "")}</td></tr>`;
      }).join("") + `</tbody></table></div>` +
      (total > transactions.length ? `<div class="muted" style="margin-top:.5rem;font-size:.82rem">Showing ${transactions.length} of ${total}.</div>` : "");
  } catch (error) { byId("tx-list").innerHTML = `<span class="msg err">${esc(error.message)}</span>`; }
}

async function loadKeyMini() {
  try {
    const { keys } = await api("/keys");
    const activeKey = keys.find((key) => key.status === "active");
    byId("acct-key-mini").innerHTML = activeKey
      ? `<div class="row" style="justify-content:space-between">
           <div><div class="mono">${esc(activeKey.prefix)}…</div><div class="muted" style="font-size:.8rem">Created ${esc(new Date(activeKey.createdAt).toLocaleDateString())}</div></div>
           <span class="pill pill-ok">active</span></div>`
      : `<span class="muted">No active key.</span>`;
  } catch (error) { byId("acct-key-mini").innerHTML = `<span class="msg err">${esc(error.message)}</span>`; }
}

// ------------------------------------------------------------------ keys
async function loadKeys() {
  byId("keys-list").innerHTML = `<div class="muted" style="padding:.8rem">Loading…</div>`;
  try {
    const { keys } = await api("/keys");
    const activeCount = keys.filter((key) => key.status === "active").length;
    byId("keys-list").innerHTML = keys.length
      ? `<table><thead><tr><th>Key prefix</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>` +
        keys.map((key) => `<tr${key.status === "active" ? "" : ' style="opacity:.6"'}>
          <td class="mono">${esc(key.prefix)}…</td>
          <td>${key.status === "active" ? '<span class="pill pill-ok">active</span>' : '<span class="pill pill-muted">revoked</span>'}</td>
          <td class="muted">${esc(new Date(key.createdAt).toLocaleDateString())}</td>
          <td>${key.status === "active"
            ? `<button class="btn-danger btn-sm" data-revoke="${esc(key.hash)}" data-prefix="${esc(key.prefix)}" data-last="${activeCount <= 1 ? "1" : ""}">Revoke</button>`
            : ""}</td></tr>`).join("") + `</tbody></table>`
      : `<div class="muted" style="padding:.8rem">No keys.</div>`;
    await loadKeyMini();
  } catch (error) { byId("keys-list").innerHTML = `<div style="padding:.8rem"><span class="msg err">${esc(error.message)}</span></div>`; }
}

async function issueKey() {
  byId("keys-new").disabled = true;
  try {
    const created = await api("/keys", { method: "POST" });
    byId("keys-reveal").innerHTML =
      `<div class="card" style="margin-top:1rem;border-style:dashed">
        <div class="section-label">New key · one-time reveal</div>
        <div class="row" style="gap:.5rem">
          <code class="mono grow" style="background:var(--surface-2);border:1px solid var(--border);border-radius:8px;padding:.5rem .7rem;word-break:break-all;font-size:.78rem">${esc(created.key)}</code>
          <button class="btn-ghost btn-sm" id="reveal-copy" style="flex-shrink:0">Copy</button>
        </div>
        <div class="banner banner-danger" style="margin-top:.7rem">⚠ This key will <b>never be shown again</b>. Copy it to a secure location now.</div>
      </div>`;
    byId("reveal-copy").onclick = () => copyText(created.key, byId("reveal-copy"));
    byId("keys-msg").innerHTML = "";
    await loadKeys();
  } catch (error) { showMsg(byId("keys-msg"), error.message, "err"); }
  finally { byId("keys-new").disabled = false; }
}

// Type-to-confirm revoke. Revoking the last active key locks the account out of
// the API, so we warn harder and still require typing DELETE either way.
async function revokeKey(hash, prefix, isLast) {
  const warning = isLast
    ? `⚠ This is your LAST active key.\n\nRevoking it locks this account out of the API. You would have to sign up again or ask the team to issue a new key.\n\nType DELETE to revoke ${prefix}:`
    : `Revoke key ${prefix}? Anything using it stops working immediately.\n\nType DELETE to confirm:`;
  const typed = prompt(warning);
  if (typed === null) return;
  if (typed !== "DELETE") { showMsg(byId("keys-msg"), "Cancelled. You must type DELETE exactly to revoke.", "err"); return; }
  try {
    await api(`/keys/${hash}?confirm=DELETE`, { method: "DELETE" });
    showMsg(byId("keys-msg"), "Key revoked.", "ok");
    await loadKeys();
  } catch (error) { showMsg(byId("keys-msg"), error.message, "err"); }
}

// ------------------------------------------------------------------ signup
async function signup() {
  const name = byId("signup-name").value.trim();
  if (!name) { showMsg(byId("signup-msg"), "Name is required.", "err"); return; }
  byId("signup-btn").disabled = true;
  try {
    const data = await api("/signup", {
      method: "POST",
      body: { name, email: byId("signup-email").value.trim() || undefined },
      auth: false,
    });
    byId("signup-key").textContent = data.key;
    byId("signup-form").classList.add("hide");
    byId("signup-reveal").classList.remove("hide");
  } catch (error) {
    showMsg(byId("signup-msg"), error.message, "err");
    byId("signup-btn").disabled = false;
  }
}

// ------------------------------------------------------------------ templates
async function loadTemplates() {
  const { templates: list } = await api("/templates");
  templates = list;
  renderTemplates();
  byId("job-tpl").innerHTML = list.map((template) => `<option value="${template.templateId}">${esc(template.name)} ${template.approved ? "✓" : "⚠"}</option>`).join("");
  showFields();
}

function templateRow(template, showActions) {
  const trust = template.approved ? '<span class="pill pill-ok">approved</span>' : '<span class="pill pill-warn">unapproved</span>';
  const actions = `<button class="btn-ghost btn-sm" data-preview="${esc(template.templateId)}">Preview</button>` +
    (showActions ? ` <button class="btn-danger btn-sm" data-delete="${esc(template.templateId)}" data-name="${esc(template.name)}">Delete</button>` : "");
  return `<tr>
    <td>${esc(template.name)}</td>
    <td class="mono muted">${esc((template.fields || []).join(", ") || "none")}</td>
    <td>${trust}</td>
    <td class="mono muted">${shortId(template.templateId)}</td>
    <td>${actions}</td></tr>`;
}

function renderTemplates() {
  const query = byId("tpl-search").value.trim().toLowerCase();
  const filter = byId("tpl-filter").value;
  const matches = (template) =>
    (!query || template.name.toLowerCase().includes(query)) &&
    (filter === "all" || (filter === "approved" ? template.approved : !template.approved));

  const owned = templates.filter((template) => template.owned && matches(template));
  const catalog = templates.filter((template) => !template.owned && matches(template));
  const header = `<thead><tr><th>Name</th><th>Fields</th><th>Status</th><th>Template ID</th><th></th></tr></thead>`;

  byId("tpl-catalog").innerHTML = catalog.length
    ? `<table>${header}<tbody>${catalog.map((template) => templateRow(template, false)).join("")}</tbody></table>`
    : `<div class="muted" style="padding:.8rem">No public templates match.</div>`;
  byId("tpl-owned").innerHTML = owned.length
    ? `<table>${header}<tbody>${owned.map((template) => templateRow(template, true)).join("")}</tbody></table>`
    : `<div class="muted" style="padding:.8rem">No templates of your own yet. Submit one below.</div>`;
}

function showFields() {
  const template = templates.find((entry) => entry.templateId === byId("job-tpl").value);
  const fieldList = template && template.fields.length ? template.fields : [];
  byId("job-fields").textContent = fieldList.length ? "Needs columns: " + fieldList.join(", ") : "";
  byId("job-csv-fields").innerHTML = fieldList.length ? fieldList.map((field) => `<span class="chip">${esc(field)}</span>`).join(" ") : `<span class="muted">none</span>`;
  byId("job-const-fields").textContent = fieldList.length ? "(keys: " + fieldList.join(", ") + ")" : "";
}

async function submitTemplate() {
  try {
    await api("/templates", { method: "POST", body: { name: byId("tpl-name").value, html: byId("tpl-html").value, requestApproval: byId("tpl-approve").checked } });
    showMsg(byId("tpl-msg"), "Template submitted.", "ok");
    byId("tpl-name").value = ""; byId("tpl-html").value = "";
    await loadTemplates();
  } catch (error) { showMsg(byId("tpl-msg"), error.message, "err"); }
}

// Retire a template you own (soft archive). The API allows this only for the
// owner; the Delete button is shown only on owned rows.
async function deleteTemplate(templateId, name) {
  if (!confirm(`Delete template "${name}"?\n\nIt will be retired: hidden from your list and unusable for new jobs. Jobs already running on it keep working. You can revive it by re-submitting the identical HTML.`)) return;
  try {
    await api(`/templates/${templateId}`, { method: "DELETE" });
    showMsg(byId("tpl-msg"), `Template "${name}" retired.`, "ok");
    await loadTemplates();
  } catch (error) { showMsg(byId("tpl-msg"), error.message, "err"); }
}

function openSubmitForm() {
  byId("tpl-submit-card").classList.remove("hide");
  byId("tpl-submit-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ------------------------------------------------------------------ create job
function currentJobType() {
  return document.querySelector('input[name="job-type"]:checked').value;
}

function onTypeChange() {
  const isConstant = currentJobType() === "constant";
  byId("job-csv-mode").classList.toggle("hide", isConstant);
  byId("job-constant-mode").classList.toggle("hide", !isConstant);
  byId("radio-csv").classList.toggle("selected", !isConstant);
  byId("radio-constant").classList.toggle("selected", isConstant);
  clearEstimate();
}

function clearEstimate() {
  byId("est-tasks").textContent = "—";
  byId("est-rate").textContent = "—";
  byId("est-total").textContent = "—";
  byId("est-banner").classList.add("hide");
}

function parseConstantData() {
  const raw = byId("job-data").value.trim();
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw new Error('Data must be a valid JSON object, e.g. {"question":"Good?"}'); }
}

function jobBody() {
  const type = currentJobType();
  const base = { type, name: byId("job-name").value || "Untitled job", templateId: byId("job-tpl").value, reward: byId("job-reward").value, uniqueWorker: byId("job-unique").checked };
  if (type === "constant") return { ...base, data: parseConstantData(), maxTasks: Number(byId("job-maxtasks").value) };
  return { ...base, csv: byId("job-csv").value };
}

async function estimate() {
  try {
    const result = await api("/jobs/estimate", { method: "POST", body: jobBody() });
    byId("est-tasks").textContent = result.taskCount;
    byId("est-rate").textContent = result.rewardPerTask;
    byId("est-total").textContent = result.cost;
    const banner = byId("est-banner");
    banner.className = "banner " + (result.sufficient ? "banner-ok" : "banner-warn");
    banner.textContent = `Balance: ${result.balance} EFFECT — ${result.sufficient ? "sufficient ✓" : "not enough credit"}`;
    banner.classList.remove("hide");
    byId("job-msg").innerHTML = "";
  } catch (error) { clearEstimate(); showMsg(byId("job-msg"), error.message, "err"); }
}

async function createJob() {
  try {
    const job = await api("/jobs", { method: "POST", body: jobBody() });
    showMsg(byId("job-msg"), `Created job ${job.id} (${job.taskCount} tasks, reserved ${job.credits.reserved} EFFECT).`, "ok");
    await Promise.all([loadAccount(), loadJobs()]);
    await loadOverview();
  } catch (error) { showMsg(byId("job-msg"), error.message, "err"); }
}

function downloadCsvTemplate() {
  const template = templates.find((entry) => entry.templateId === byId("job-tpl").value);
  const fields = (template && template.fields.length) ? template.fields : ["field1", "field2"];
  triggerDownload(fields.join(",") + "\n", `template-${(template ? template.name : "job").replace(/\s+/g, "-")}.csv`);
}

// ------------------------------------------------------------------ jobs
function jobStatusPill(job) {
  const outstanding = job.tasks.queued + job.tasks.active;
  if (job.status !== "active") return { label: job.status, html: `<span class="pill pill-danger">${esc(job.status)}</span>` };
  if (outstanding === 0) return { label: "done", html: `<span class="pill pill-ok">done</span>` };
  return { label: "active", html: `<span class="pill pill-warn">active</span>` };
}

async function loadJobs() {
  try {
    const { jobs } = await api("/jobs");
    jobsCache = jobs;
    renderJobs();
  } catch (error) { byId("jobs-body").innerHTML = `<tr><td colspan="5"><span class="msg err">${esc(error.message)}</span></td></tr>`; }
}

function renderJobs() {
  const query = byId("jobs-search").value.trim().toLowerCase();
  const filter = byId("jobs-filter").value;
  const rows = jobsCache.filter((job) => {
    const statusLabel = jobStatusPill(job).label;
    return (!query || job.name.toLowerCase().includes(query) || job.id.toLowerCase().includes(query)) &&
      (filter === "all" || statusLabel === filter);
  });

  if (!rows.length) { byId("jobs-body").innerHTML = `<tr><td colspan="5" class="muted">No jobs match. Create one in the Create Job tab.</td></tr>`; return; }

  byId("jobs-body").innerHTML = rows.map((job) => {
    const status = jobStatusPill(job);
    const base = `<tr class="job-row${openJobId === job.id ? " open" : ""}" data-job="${job.id}">
      <td><div>${esc(job.name)}</div><div class="mono muted" style="font-size:.72rem">${shortId(job.id)}</div></td>
      <td>${status.html}</td>
      <td class="mono">${job.tasks.queued} / ${job.tasks.active} / ${job.tasks.completed}</td>
      <td class="mono">${esc(job.credits.consumed)} / ${esc(job.credits.remaining)}</td>
      <td>${status.label === "active" && (job.tasks.queued + job.tasks.active) > 0 ? `<button class="btn-danger btn-sm" data-cancel="${job.id}">Cancel</button>` : ""}</td></tr>`;
    const detail = openJobId === job.id ? `<tr class="job-detail"><td colspan="5"><div class="job-detail-inner" id="detail-${job.id}"><span class="muted">Loading…</span></div></td></tr>` : "";
    return base + detail;
  }).join("");

  if (openJobId) renderJobDetail(openJobId);
}

function toggleJob(jobId) {
  openJobId = openJobId === jobId ? null : jobId;
  renderJobs();
}

async function renderJobDetail(jobId) {
  const job = jobsCache.find((entry) => entry.id === jobId);
  const container = byId("detail-" + jobId);
  if (!job || !container) return;
  const template = templates.find((entry) => entry.templateId === job.templateId);
  const done = job.tasks.completed;
  const totalTasks = job.tasks.queued + job.tasks.active + job.tasks.completed;
  const percent = totalTasks ? Math.round((done / totalTasks) * 100) : 0;

  container.innerHTML =
    `<div class="kv-grid">
       <div class="kv"><div class="kk">Type</div><div class="vv">${job.type === "constant" ? "Constant / survey" : "CSV"}</div></div>
       <div class="kv"><div class="kk">Template</div><div class="vv">${esc(template ? template.name : shortId(job.templateId))}</div></div>
       <div class="kv"><div class="kk">Reward</div><div class="vv">${esc(job.reward)} EFFECT / task</div></div>
     </div>
     <div class="kk muted" style="font-size:.72rem;margin-bottom:.25rem">Task completion</div>
     <div class="progress"><div class="progress-fill" style="width:${percent}%"></div></div>
     <div class="muted" style="font-size:.78rem;margin:.3rem 0 .3rem">${done} / ${totalTasks} tasks complete (${percent}%)</div>
     <div class="credit-grid">
       <div class="credit-cell"><div class="n">${esc(job.credits.reserved)}</div><div class="l">Reserved</div></div>
       <div class="credit-cell"><div class="n">${esc(job.credits.consumed)}</div><div class="l">Consumed</div></div>
       <div class="credit-cell"><div class="n">${esc(job.credits.refunded)}</div><div class="l">Refunded</div></div>
       <div class="credit-cell"><div class="n">${esc(job.credits.remaining)}</div><div class="l">Remaining</div></div>
     </div>
     <div id="detail-results-${jobId}" class="muted" style="font-size:.82rem">Loading recent results…</div>
     <div class="row" style="margin-top:.7rem">
       <button class="btn-ghost btn-sm" data-results="${jobId}" data-name="${esc(job.name)}">View all results</button>
       <button class="btn-ghost btn-sm" data-download="${jobId}">↓ Download CSV</button>
       ${jobStatusPill(job).label === "active" && (job.tasks.queued + job.tasks.active) > 0 ? `<button class="btn-danger btn-sm" data-cancel="${jobId}">Cancel job</button>` : ""}
     </div>`;

  try {
    const preview = await api(`/jobs/${jobId}/results?limit=3`);
    const target = byId("detail-results-" + jobId);
    if (!target) return;
    target.innerHTML = preview.count
      ? `<div class="kk muted" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.35rem">Recent results (${preview.count} of ${preview.total})</div>
         <div class="table-wrap"><table><thead><tr><th>Task ID</th><th>Worker</th><th>Result</th></tr></thead><tbody>` +
        preview.results.map((row) => `<tr>
          <td class="mono">${shortId(row.taskId)}</td>
          <td class="mono">${shortId(row.worker)}</td>
          <td>${esc(typeof row.result === "object" ? JSON.stringify(row.result) : row.result)}</td></tr>`).join("") +
        `</tbody></table></div>`
      : `<span class="muted">No results yet (workers have not completed any tasks).</span>`;
  } catch (error) {
    const target = byId("detail-results-" + jobId);
    if (target) target.innerHTML = `<span class="msg err">${esc(error.message)}</span>`;
  }
}

async function cancelJob(jobId) {
  if (!confirm("Cancel this job? Unfinished tasks are refunded.")) return;
  try {
    await api(`/jobs/${jobId}/cancel`, { method: "POST" });
    await Promise.all([loadAccount(), loadJobs()]);
    await loadOverview();
  } catch (error) { alert(error.message); }
}

// ------------------------------------------------------------------ overview
async function loadOverview() {
  try {
    const account = await api("/account");
    byId("ov-balance").textContent = effectFromLamports(account.credits.balance).toLocaleString();

    const activeJobs = jobsCache.filter((job) => jobStatusPill(job).label === "active");
    byId("ov-active").textContent = activeJobs.length;
    byId("ov-pending").textContent = jobsCache.reduce((sum, job) => sum + job.tasks.queued + job.tasks.active, 0).toLocaleString();
    const approvedCount = templates.filter((template) => template.approved).length;
    byId("ov-templates").textContent = templates.length;
    byId("ov-templates-sub").textContent = `${approvedCount} approved`;

    await renderActivity();
  } catch (error) { byId("ov-activity").innerHTML = `<span class="msg err">${esc(error.message)}</span>`; }
}

// No dedicated activity endpoint exists, so the feed is synthesized from the
// real timestamps we do have: job creation and credit transactions.
async function renderActivity() {
  const events = [];
  for (const job of jobsCache) {
    if (job.createdAt) events.push({ time: new Date(job.createdAt).getTime(), text: `Job "${esc(job.name)}" created`, meta: `${job.taskCount} tasks` });
  }
  try {
    const { transactions } = await api("/credits/transactions?limit=10");
    for (const transaction of transactions) {
      const amount = effectFromLamports(transaction.amount);
      const sign = transaction.type === "debit" ? "-" : "+";
      events.push({ time: Number(transaction.timestamp), text: transaction.type === "topup" ? "Credit top-up" : `Credit ${esc(transaction.type)}`, meta: `${sign}${amount} EFFECT` });
    }
  } catch { /* transactions are best-effort for the feed */ }

  events.sort((first, second) => second.time - first.time);
  const recent = events.slice(0, 6);
  byId("ov-activity").innerHTML = recent.length
    ? recent.map((event) => `<div class="activity-row"><span class="when">${relativeTime(event.time)}</span><div>${event.text} <span class="muted">— ${event.meta}</span></div></div>`).join("")
    : `<span class="muted">No activity yet.</span>`;
}

// ------------------------------------------------------------------ preview
// Full template preview in a sandboxed iframe, fetched via the API (the only
// way to send the Bearer key; a new tab could not authenticate). The sample
// data bar re-renders the template server-side with user-typed values, so
// templates that expect real shapes (image URLs, JSON strings) can be
// previewed working. Last-used values persist per template in localStorage
// (non-sensitive; template IDs are content-addressed, so stored values can
// never apply to changed HTML).
let previewTemplateId = null;

const sampleStorageKey = (templateId) => "effect-console-sample:" + templateId;
function loadStoredSample(templateId) {
  try { return JSON.parse(localStorage.getItem(sampleStorageKey(templateId))) || {}; }
  catch { return {}; }
}

async function previewTemplate(templateId) {
  previewTemplateId = templateId;
  const frame = byId("tpl-preview-frame");
  byId("tpl-preview").classList.remove("hide");
  byId("tpl-preview-title").textContent = "Loading preview…";
  byId("tpl-preview-id").textContent = "";
  byId("tpl-preview-trust").innerHTML = "";
  byId("tpl-preview-note").classList.add("hide");
  byId("tpl-preview-data").classList.add("hide");
  frame.srcdoc = "";
  try {
    const stored = loadStoredSample(templateId);
    const preview = Object.keys(stored).length
      ? await api(`/templates/${templateId}/preview`, { method: "POST", body: { data: stored } })
      : await api(`/templates/${templateId}/preview`);
    byId("tpl-preview-title").textContent = preview.name || "Template preview";
    byId("tpl-preview-id").textContent = shortId(preview.templateId);
    byId("tpl-preview-url").textContent = "sandbox://preview/" + shortId(preview.templateId);
    byId("tpl-preview-trust").innerHTML = preview.approved ? `<span class="pill pill-ok">approved</span>` : `<span class="pill pill-warn">unapproved</span>`;
    byId("tpl-preview-note").classList.toggle("hide", preview.approved);
    renderSampleBar(preview.fields || [], preview.sampleData || {});
    frame.srcdoc = preview.html;
  } catch (error) {
    byId("tpl-preview-title").textContent = "Preview failed";
    frame.srcdoc = `<p style="font:14px/1.5 system-ui,sans-serif;padding:1rem;color:#b00020">${esc(error.message)}</p>`;
  }
}

// `values` echoes what the server actually rendered (stored overrides merged
// over the field-name defaults), so the inputs always match the iframe.
function renderSampleBar(fields, values) {
  const bar = byId("tpl-preview-data");
  if (!fields.length) { bar.innerHTML = ""; bar.classList.add("hide"); return; }
  bar.innerHTML =
    `<div class="sample-label">Sample data — fill fields as a real task row would</div>` +
    fields.map((field) => `<label class="sample-field"><span>\${${esc(field)}}</span><input data-sample-field="${esc(field)}" value="${esc(values[field] ?? "")}" placeholder="${esc(field)}"></label>`).join("") +
    `<button class="btn-primary btn-sm" id="tpl-preview-apply">Re-render</button>`;
  bar.classList.remove("hide");
}

async function applySampleData() {
  if (!previewTemplateId) return;
  const data = {};
  byId("tpl-preview-data").querySelectorAll("[data-sample-field]").forEach((input) => {
    data[input.dataset.sampleField] = input.value;
  });
  localStorage.setItem(sampleStorageKey(previewTemplateId), JSON.stringify(data));
  const frame = byId("tpl-preview-frame");
  try {
    const preview = await api(`/templates/${previewTemplateId}/preview`, { method: "POST", body: { data } });
    frame.srcdoc = preview.html;
  } catch (error) {
    frame.srcdoc = `<p style="font:14px/1.5 system-ui,sans-serif;padding:1rem;color:#b00020">${esc(error.message)}</p>`;
  }
}

function closePreview() {
  previewTemplateId = null;
  byId("tpl-preview").classList.add("hide");
  byId("tpl-preview-frame").srcdoc = "";
  byId("tpl-preview-data").innerHTML = "";
}

// ------------------------------------------------------------------ results drawer
async function openResults(jobId, name) {
  drawerJobId = jobId;
  byId("results-drawer").classList.remove("hide");
  byId("drawer-title").textContent = "Results · " + name;
  byId("drawer-sub").textContent = "Loading…";
  byId("drawer-json").textContent = "Loading…";
  byId("drawer-table").innerHTML = "";
  showDrawerView("json");
  try {
    const response = await api(`/jobs/${jobId}/results?limit=200`);
    drawerResults = response.results || [];
    byId("drawer-sub").textContent = `${response.total} results total`;
    byId("drawer-count").textContent = `${response.count} shown of ${response.total}`;
    byId("drawer-json").textContent = drawerResults.length ? JSON.stringify(drawerResults, null, 2) : "No results yet (workers have not completed any tasks).";
    renderDrawerTable();
  } catch (error) {
    byId("drawer-json").textContent = error.message;
    byId("drawer-sub").textContent = "";
  }
}

function renderDrawerTable() {
  if (!drawerResults.length) { byId("drawer-table").innerHTML = `<span class="muted">No results yet.</span>`; return; }
  byId("drawer-table").innerHTML =
    `<div class="table-wrap"><table><thead><tr><th>Task ID</th><th>Worker</th><th>Result</th><th>Submitted</th></tr></thead><tbody>` +
    drawerResults.map((row) => `<tr>
      <td class="mono">${shortId(row.taskId)}</td>
      <td class="mono">${shortId(row.worker)}</td>
      <td>${esc(typeof row.result === "object" ? JSON.stringify(row.result) : row.result)}</td>
      <td class="muted">${row.submittedAt ? esc(new Date(row.submittedAt).toLocaleString()) : ""}</td></tr>`).join("") +
    `</tbody></table></div>`;
}

function showDrawerView(view) {
  document.querySelectorAll(".drawer-tab").forEach((tabButton) => tabButton.classList.toggle("active", tabButton.dataset.view === view));
  byId("drawer-json").classList.toggle("hide", view !== "json");
  byId("drawer-table").classList.toggle("hide", view !== "table");
}

function closeDrawer() { byId("results-drawer").classList.add("hide"); }

async function downloadCsv(jobId) {
  triggerDownload(await fetchResultsCsv(jobId), `job-${jobId}-results.csv`);
}

// ------------------------------------------------------------------ small utils
function copyText(text, buttonElement) {
  navigator.clipboard.writeText(text).then(() => {
    const original = buttonElement.textContent;
    buttonElement.textContent = "Copied!";
    setTimeout(() => { buttonElement.textContent = original; }, 2000);
  });
}
function triggerDownload(content, filename) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------ wiring
byId("connect").onclick = connect;
byId("key").addEventListener("keydown", (event) => { if (event.key === "Enter") connect(); });
byId("disconnect").onclick = disconnect;
byId("theme-toggle").onclick = toggleTheme;

byId("signup-btn").onclick = signup;
byId("signup-name").addEventListener("keydown", (event) => { if (event.key === "Enter") signup(); });
byId("signup-copy").onclick = () => copyText(byId("signup-key").textContent, byId("signup-copy"));

// Tabs + any element that jumps to a tab (metric CTAs, quick actions)
document.querySelectorAll(".tab").forEach((tabButton) => {
  tabButton.onclick = () => { if (!tabButton.disabled) showTab(tabButton.dataset.tab); };
});
document.addEventListener("click", (event) => {
  const jump = event.target.closest("[data-goto]");
  if (jump) {
    showTab(jump.dataset.goto);
    if (jump.dataset.openSubmit) openSubmitForm();
  }
});

// Templates
byId("tpl-open-submit").onclick = openSubmitForm;
byId("tpl-collapse").onclick = () => byId("tpl-submit-card").classList.add("hide");
byId("tpl-submit").onclick = submitTemplate;
byId("tpl-search").addEventListener("input", renderTemplates);
byId("tpl-filter").addEventListener("change", renderTemplates);
byId("panel-templates").addEventListener("click", (event) => {
  if (event.target.dataset.preview) previewTemplate(event.target.dataset.preview);
  if (event.target.dataset.delete) deleteTemplate(event.target.dataset.delete, event.target.dataset.name);
});

// Create job
document.querySelectorAll('input[name="job-type"]').forEach((radio) => radio.addEventListener("change", onTypeChange));
byId("job-tpl").onchange = showFields;
byId("job-estimate").onclick = estimate;
byId("job-create").onclick = createJob;
byId("job-csv-template").onclick = downloadCsvTemplate;

// Jobs
byId("jobs-refresh").onclick = loadJobs;
byId("jobs-search").addEventListener("input", renderJobs);
byId("jobs-filter").addEventListener("change", renderJobs);
byId("jobs-body").addEventListener("click", (event) => {
  if (event.target.dataset.cancel) { event.stopPropagation(); cancelJob(event.target.dataset.cancel); return; }
  if (event.target.dataset.results) { event.stopPropagation(); openResults(event.target.dataset.results, event.target.dataset.name); return; }
  if (event.target.dataset.download) { event.stopPropagation(); downloadCsv(event.target.dataset.download); return; }
  const row = event.target.closest(".job-row");
  if (row) toggleJob(row.dataset.job);
});

// Account
byId("acct-save").onclick = saveAccount;

// Keys
byId("keys-new").onclick = issueKey;
byId("keys-list").addEventListener("click", (event) => {
  if (event.target.dataset.revoke) revokeKey(event.target.dataset.revoke, event.target.dataset.prefix, event.target.dataset.last === "1");
});

// Preview modal + results drawer. The preview modal closes only via its X
// button (or Escape), never by clicking the backdrop, so a stray click can't
// discard sample-data edits.
byId("tpl-preview-close").onclick = closePreview;
// Sample data bar is re-rendered per template, so its events are delegated.
byId("tpl-preview-data").addEventListener("click", (event) => { if (event.target.id === "tpl-preview-apply") applySampleData(); });
byId("tpl-preview-data").addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target.dataset.sampleField) applySampleData(); });
byId("drawer-close").onclick = closeDrawer;
byId("results-drawer").addEventListener("click", (event) => { if (event.target.id === "results-drawer") closeDrawer(); });
byId("drawer-csv").onclick = () => { if (drawerJobId) downloadCsv(drawerJobId); };
document.querySelectorAll(".drawer-tab").forEach((tabButton) => tabButton.onclick = () => showDrawerView(tabButton.dataset.view));

// Load account transactions when the Account tab is first opened, and lazily
// after that on each visit, so the history stays fresh.
document.querySelector('.tab[data-tab="account"]').addEventListener("click", () => { loadTransactions(); loadKeyMini(); });

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!byId("tpl-preview").classList.contains("hide")) closePreview();
  else if (!byId("results-drawer").classList.contains("hide")) closeDrawer();
});

// No session persistence: the page always loads showing the signup view with an
// empty key field. The user connects by pasting their key each visit.
