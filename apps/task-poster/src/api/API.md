# Effect AI Requestor API (v1)

Post microtasks to the Effect AI network and retrieve their results
programmatically. You bring a CSV of inputs and a template; workers complete
one task per row; you poll for results.

> **Status: v1.** On-chain credit purchase and webhooks are not in v1. Credits
> are topped up by the Effect team, and results are retrieved by polling.

## Getting started

1. **Create an account** (self-service — no team action required):
   ```bash
   curl -X POST https://HOST/api/v1/signup \
     -H "Content-Type: application/json" \
     -d '{ "name": "Acme Corp", "email": "you@acme.com" }'
   ```
   Returns a `key` — copy it now, it is shown only once.

2. **Check your balance:**
   ```bash
   curl https://HOST/api/v1/account -H "Authorization: Bearer $KEY"
   ```

3. **Pick or submit a template** (the HTML workers see; `${field}` placeholders
   are filled from your CSV columns):
   ```bash
   curl https://HOST/api/v1/templates -H "Authorization: Bearer $KEY"
   ```

4. **Estimate, then create a job** from a CSV (one row = one task):
   ```bash
   curl -X POST https://HOST/api/v1/jobs -H "Authorization: Bearer $KEY" \
     -H "Content-Type: application/json" -d '{
       "type":"csv","name":"My job","templateId":"<id>","reward":"0.5",
       "csv":"product,question\nWidget,Good?\nGadget,Good?"
     }'
   ```

5. **Poll for results** as workers complete tasks:
   ```bash
   curl "https://HOST/api/v1/jobs/<jobId>/results" -H "Authorization: Bearer $KEY"
   ```

> A live, rendered copy of this page is served by the app at **`/api/docs`**.
> Prefer a UI? The **API console** at **`/api-console.html`** drives all of the
> above (paste your key, submit templates, preview templates, create jobs from a
> CSV, view results) with no curl needed. Your key is **never stored** — you
> will need to paste it again each time you open the console.

## Authentication

Every request needs your API key as a Bearer token:

```
Authorization: Bearer eff_live_xxxxxxxxxxxxxxxxxxxx
```

(`X-API-Key: <key>` is also accepted.) Keys are shown **once** — store them
securely. A key maps to one account with a credit balance.

## Base URL and versioning

All endpoints are under `/<host>/api/v1`. Breaking changes ship under a new
version prefix.

## Units

Rewards and balances are in **EFFECT** (the network token). `1 EFFECT =
1,000,000 lamports`. You pass `reward` as an EFFECT amount (e.g. `"0.5"`);
balances are also reported in EFFECT.

## Credits

- **Cost of a job** = `reward x number of tasks`, debited up front.
- Tasks that never get a submission (e.g. on cancel) are **refunded**.
- The team tops up your balance manually for now.

## Errors

Non-2xx responses use a consistent envelope:

```json
{ "error": { "code": "insufficient_credits", "message": "Insufficient credits: need 2000000 lamports, have 500000." } }
```

| Code | HTTP | Meaning |
|---|---|---|
| `unauthorized` | 401 | Missing or invalid API key |
| `forbidden` | 403 | Key valid but resource not accessible to your account |
| `not_found` | 404 | Resource does not exist |
| `invalid_request` | 400 | Bad input (missing field, CSV parse error, etc.) |
| `insufficient_credits` | 402 | Not enough credit balance |
| `rate_limited` | 429 | Over the rate limit |
| `internal` | 500 | Server error (credits are refunded automatically if a job creation fails after debit) |

## Rate limits

120 requests/minute per key. Responses include `X-RateLimit-Limit` and
`X-RateLimit-Remaining`; over the limit returns `429 rate_limited`.

The signup endpoint has a tighter limit: 3 accounts per IP per 24 hours.

---

## Endpoints

### `POST /api/v1/signup`

Create a new account and receive your first API key. No existing key required.

```bash
curl -X POST https://HOST/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{ "name": "Acme Corp", "email": "you@acme.com" }'
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Max 100 characters |
| `email` | no | Not stored for auth; for contact only |

```json
{ "key": "eff_live_xxxxxxxxxxxxxxxxxxxx", "accountId": "01J…", "name": "Acme Corp" }
```

The `key` is shown only once. New accounts start with a zero credit balance;
contact the Effect team to top up.

---

### `GET /api/v1/account`

Your account details and credit balance.

```bash
curl https://HOST/api/v1/account -H "Authorization: Bearer $KEY"
```
```json
{ "id": "01J…", "name": "Acme Corp", "email": "you@acme.com", "status": "active",
  "createdAt": 1700000000000,
  "credits": { "balance": "12500000", "currency": "EFFECT", "lamportsPerEffect": 1000000 } }
```

`credits.balance` is in **lamports** (divide by `lamportsPerEffect` for EFFECT).
`email` is `null` if none is set.

### `PATCH /api/v1/account`

Update your contact fields. Partial update — send only the fields you want to
change. Passing `"email": ""` clears the stored email. Returns the same object
as `GET /account`.

```bash
curl -X PATCH https://HOST/api/v1/account -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{ "name": "Acme Inc", "email": "ops@acme.com" }'
```

| Field | Required | Notes |
|---|---|---|
| `name` | no | If present, must be non-empty and ≤ 100 characters |
| `email` | no | If present, replaces the stored email; `""` clears it |

At least one of `name` / `email` must be provided.

---

### `GET /api/v1/keys`

List the API keys on your account. The raw key is **never** returned here — only
its display `prefix`, `status`, and `hash` (the id you pass to `DELETE`).

```bash
curl https://HOST/api/v1/keys -H "Authorization: Bearer $KEY"
```
```json
{ "keys": [
  { "hash": "9f86d0…", "prefix": "eff_live_ab12cd…", "status": "active", "createdAt": 1700000000000 }
], "total": 1 }
```

### `POST /api/v1/keys`

Issue an additional key for your account (for rotation, or a per-service key).
The raw `key` is returned **once** — store it now.

```bash
curl -X POST https://HOST/api/v1/keys -H "Authorization: Bearer $KEY"
```
```json
{ "key": "eff_live_xxxxxxxxxxxxxxxxxxxx", "hash": "9f86d0…",
  "prefix": "eff_live_xxxxxx…", "status": "active", "createdAt": 1700000000000 }
```

> **Currently limited to one active key per account.** Multiple keys are not yet
> available: if you already have an active key this returns `403 forbidden`.
> Revoke your existing key before issuing a new one.

### `DELETE /api/v1/keys/:hash`

Revoke one of your keys by its `hash`. Idempotent — revoking an already-revoked
key returns `200`. You can only revoke keys on your own account.

```bash
curl -X DELETE "https://HOST/api/v1/keys/9f86d0…" -H "Authorization: Bearer $KEY"
```

> **Revoking your last active key** locks you out of the API (you need a valid
> key to issue a new one). This is allowed, but you must confirm by adding
> `?confirm=DELETE`; without it the request returns `400 invalid_request`.
> While accounts are limited to one active key, rotation means revoking the old
> key (with `?confirm=DELETE`) and then issuing a fresh one via `POST /keys`.

---

### `GET /api/v1/credits/transactions`

Your credit ledger — top-ups, job debits, and refunds — newest first, so you can
reconcile spend. Amounts are in **lamports** (strings), matching `GET /account`.

| Param | Default | Max | Notes |
|---|---|---|---|
| `?limit=` | 100 | 1000 | Entries per page |
| `?offset=` | 0 | — | For pagination |

```bash
curl "https://HOST/api/v1/credits/transactions?limit=50" -H "Authorization: Bearer $KEY"
```
```json
{ "transactions": [
  { "id": "01K…", "type": "debit", "amount": "1000000", "balanceAfter": "11500000",
    "jobId": "01J…", "note": "job 01J… (2 tasks)", "timestamp": 1700000000000 }
], "total": 12, "limit": 50, "offset": 0,
  "currency": "EFFECT", "lamportsPerEffect": 1000000 }
```

| Field | Meaning |
|---|---|
| `type` | `topup` (team top-up), `debit` (job created), or `refund` (cancel / failed create) |
| `amount` | Lamports moved (always positive) |
| `balanceAfter` | Balance in lamports immediately after this entry |
| `jobId` | The job this entry relates to, if any |

---

### `GET /api/v1/templates`

Templates you can use: the team's approved default catalog plus any you have
registered yourself. Archived templates are excluded. Newest first, paginated.

| Param | Default | Max | Notes |
|---|---|---|---|
| `?limit=` | 100 | 1000 | Templates per page |
| `?offset=` | 0 | — | For pagination |

```json
{ "templates": [
  { "templateId": "478b…", "name": "Sentiment",
    "fields": ["product", "question"], "approved": true, "owned": false }
], "total": 1, "limit": 100, "offset": 0 }
```

| Field | Meaning |
|---|---|
| `templateId` | Stable content-addressed ID (sha256 of the HTML — resubmitting the same HTML returns the same ID and does not reset approval) |
| `fields` | The `${...}` placeholders the template expects; your CSV must have a column for each |
| `approved` | Whether the Effect team has reviewed it — workers see a verified badge |
| `owned` | Whether you submitted this template |

### `POST /api/v1/templates`

Register a custom template (HTML with `${field}` placeholders).

```bash
curl -X POST https://HOST/api/v1/templates -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Sentiment",
        "html": "<h1>Rate ${product}</h1><p>${question}</p>",
        "requestApproval": true }'
```

| Field | Required | Notes |
|---|---|---|
| `name` | yes | Human-readable label |
| `html` | yes | Full HTML string with `${field}` placeholders |
| `requestApproval` | no | `true` queues it for team review |

Returns `201` with the template view plus `approvalRequested`.

Unapproved templates are usable immediately but run sandboxed and show workers
a caution badge until the team approves. Approval is tied to the exact HTML
(content-addressed) — changing even one character produces a new ID and
requires re-approval.

### `GET /api/v1/templates/:id/preview`

Render a template with sample data so you can inspect its layout before posting
a job. Each `${field}` is filled with its own name as the sample value. Requires
the template to be approved or owned by your account.

```bash
curl "https://HOST/api/v1/templates/478b…/preview" -H "Authorization: Bearer $KEY"
```

```json
{
  "templateId": "478b…",
  "name": "Sentiment",
  "fields": ["product", "question"],
  "approved": true,
  "html": "<h1>Rate product</h1><p>question</p>…"
}
```

The API console uses this endpoint to display a live preview inside a sandboxed
iframe — the template HTML is never trusted even if it is approved.

### `GET /api/v1/templates/:id`

A single template's metadata (no raw HTML — use `/preview` to render it). Same
access rule as preview: it must be approved (public catalog) or owned by you.

```json
{ "templateId": "478b…", "name": "Sentiment", "fields": ["product", "question"],
  "approved": true, "owned": true, "status": "active",
  "approvalRequested": false, "createdAt": 1700000000000 }
```

### `DELETE /api/v1/templates/:id`

Retire a template you own (soft archive). It disappears from `GET /templates`
and can no longer back **new** jobs; jobs already running on it are unaffected.
Because IDs are content-addressed, re-submitting the identical HTML revives it.
Returns the archived template (`status: "archived"`).

```bash
curl -X DELETE "https://HOST/api/v1/templates/478b…" -H "Authorization: Bearer $KEY"
```

Only the template's **owner** (the account that first registered it) can delete
it; public-catalog templates and ones merely re-registered by another account
return `403`. A logged-in Effect team admin may archive **any** template via the
same endpoint, authenticating with their task-poster session instead of a key.

---

### `POST /api/v1/jobs/estimate`

Validate and price a job without charging or creating anything. Accepts the
same body as `POST /api/v1/jobs` and returns validation errors with the same
codes.

```json
{ "type": "csv", "taskCount": 2, "rewardPerTask": "0.5",
  "cost": "1", "currency": "EFFECT", "balance": "8.5", "sufficient": true }
```

---

### `POST /api/v1/jobs`

Create a job. Debits `reward x tasks` up front. Returns `201` with the job
status object.

**CSV job** (1 row = 1 task):
```bash
curl -X POST https://HOST/api/v1/jobs -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{
    "type": "csv",
    "name": "Label images",
    "templateId": "478b…",
    "reward": "0.5",
    "csv": "product,question\nWidget,Good?\nGadget,Good?"
  }'
```

**Constant / survey job** — the same inputs go to up to `maxTasks` different
workers (one task each). Use it to gather many independent answers to one
question: polls, A/B preference, redundant labelling.
```bash
curl -X POST https://HOST/api/v1/jobs -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" -d '{
    "type": "constant",
    "name": "Widget survey",
    "templateId": "478b…",
    "reward": "0.2",
    "maxTasks": 100,
    "uniqueWorker": true,
    "data": { "product": "Widget", "question": "Good?" }
  }'
```

> For surveys, always set `uniqueWorker: true` — otherwise the same worker can
> fill in the same survey multiple times.

**Common fields** (both job types):

| Field | Required | Default | Notes |
|---|---|---|---|
| `type` | yes | — | `"csv"` or `"constant"` |
| `templateId` | yes | — | Must be approved or owned by you |
| `reward` | yes | — | Per-task EFFECT amount, e.g. `"0.5"` |
| `name` | no | `"Untitled job"` | Human-readable label |
| `capability` | no | `""` | Worker capability filter; leave blank for no filter |
| `timeLimitSeconds` | no | `600` | How long a worker has to complete one task |
| `uniqueWorker` | no | `false` | When `true`, each worker may complete at most one task in this job (no repeats) |

**CSV-only fields:**

| Field | Required | Notes |
|---|---|---|
| `csv` | yes | CSV string; first row is the header |

CSV must include a column for every template `${field}` and must not contain
`dataffect/reward` or any column starting with `__effect` (reserved by the
platform).

**Constant-only fields:**

| Field | Required | Notes |
|---|---|---|
| `maxTasks` | yes | How many workers answer; **cost = reward x maxTasks** |
| `data` | no | Values for the template's `${fields}` as a JSON object or JSON-encoded string; same data shown to every worker |

**Limits:**

| Constraint | Value |
|---|---|
| Max tasks per job | 10,000 |
| Min reward | 0.001 EFFECT |
| Max reward | 100 EFFECT |
| Max total job cost | 1,000,000 EFFECT |

---

### `GET /api/v1/jobs`

List your jobs, newest first.

| Param | Default | Max | Notes |
|---|---|---|---|
| `?limit=` | 100 | 1000 | Jobs per page |
| `?offset=` | 0 | — | For pagination |

```json
{ "jobs": [ { "id": "01J…", "name": "Label images", "type": "csv", … } ],
  "total": 1, "limit": 100, "offset": 0 }
```

### `GET /api/v1/jobs/:id`

Single job status.

```json
{
  "id": "01J…", "name": "Label images", "type": "csv", "status": "active",
  "templateId": "478b…", "reward": "0.5", "taskCount": 3,
  "uniqueWorker": false, "createdAt": 1700000000000,
  "tasks": { "queued": 1, "active": 1, "completed": 1, "failed": 0 },
  "credits": {
    "currency": "EFFECT",
    "reserved": "1.5",
    "consumed": "0.5",
    "refunded": "0",
    "remaining": "1"
  }
}
```

| Credit field | Meaning |
|---|---|
| `reserved` | Debited up front at job creation |
| `consumed` | `reward x completed tasks` (derived live from task counts — not stored) |
| `refunded` | Returned on cancel for tasks that never received a submission |
| `remaining` | `reserved - consumed - refunded` (clamped to 0) |

---

### `GET /api/v1/jobs/:id/results`

Completed results for your job, newest first.

| Param | Default | Max | Notes |
|---|---|---|---|
| `?limit=` | 100 | 1000 | Results per page |
| `?offset=` | 0 | — | For pagination |
| `?format=csv` | — | — | Download as CSV instead of JSON |

```json
{ "jobId": "01J…", "count": 1, "total": 42, "limit": 100, "offset": 0, "results": [
  { "taskId": "01K…", "submittedAt": 1759534321,
    "worker": "12D3Koo…",
    "input": { "product": "Widget", "question": "Good?" },
    "result": "{\"answer\":\"yes\"}" }
] }
```

`count` is the number of rows in this page; `total` is the total completed
results across all pages (use it to drive a pagination UI). `result` is a JSON
string — whatever the worker's template posted via
`window.parent.postMessage({ task: 'submit', values: … }, '*')`.

---

### `POST /api/v1/jobs/:id/cancel`

Stop a job: archives the task queue so no more tasks are posted to workers,
then refunds credits for every task that has not yet received a submission.
Returns the updated job status object.

---

## Templates 101

A template is an HTML string rendered inside an iframe for the worker, with
`${field}` placeholders substituted from each task's data.

```html
<h1>How do you rate ${product}?</h1>
<p>${question}</p>
<button onclick="window.parent.postMessage({task:'submit', values:{answer:'yes'}}, '*')">Yes</button>
<button onclick="window.parent.postMessage({task:'submit', values:{answer:'no'}}, '*')">No</button>
```

Workers submit by `postMessage`-ing `{ task: 'submit', values: … }` to the
parent frame. Whatever is in `values` comes back as the `result` string in your
results payload. There is no schema — you define the shape.

**Template IDs are content-addressed.** The ID is `sha256(managerId + ":" + html)`.
Submitting the same HTML twice returns the same `templateId` and does not reset
the approval state. Changing the HTML by even one character produces a new ID
and requires a new approval request.

---

## Pipeline / chained jobs (planned, not in v1)

> **Not implemented.** `"type": "pipeline"` is rejected by the API today. This
> section documents the intended design so integrators can plan for it. The
> underlying engine already runs pipelines internally; the remaining work is the
> credit model and access-scoping for external accounts.

A pipeline job feeds the results of one of your existing jobs into a new job as
inputs — e.g. job A collects raw labels, then job B has different workers
validate A's answers.

**Proposed request:**
```jsonc
POST /api/v1/jobs
{
  "type": "pipeline",
  "templateId": "<validation template>",
  "reward": "0.3",
  "sourceJobId": "01J…",  // must be a job you own
  "filter": "^yes$",       // optional: only forward results matching this regex
  "maxTasks": 500          // required spend cap
}
```

Each completed task in `sourceJobId` mints one downstream task. The upstream
answer is forwarded as these template placeholders:

| Placeholder | Meaning |
|---|---|
| `${result}` | Upstream worker's submitted answer (JSON string) |
| `${taskId}` | Upstream task ID |
| `${submissionByPeer}` | Upstream worker ID (excluded from the downstream task so a different person validates) |
| `${timestamp}` | When the upstream answer was submitted |

Credits: debit `reward x maxTasks` up front; refund the remainder when the
pipeline finishes or is cancelled.

Open questions before building: chaining depth (pipeline off a pipeline?);
behaviour when the source job is cancelled mid-run; whether to allow only
completed jobs or actively running ones as source.

---

## Admin (Effect team only)

Account creation, key issuance, top-ups, and template approvals live behind the
team dashboard (cookie auth) at:

- `/admin/accounts` — manage accounts, issue/revoke API keys, top up balances
- `/admin/templates/pending` — review and approve/reject submitted templates

These are not part of the public API. A logged-in admin may additionally
retire any template by calling `DELETE /api/v1/templates/:id` with their
task-poster session cookie (no API key required).

---

## Implementation notes (for developers)

### Source files

| File | Purpose |
|---|---|
| `src/server.ts` | Express app entry point — mounts CORS middleware, rate limiter, all route groups |
| `src/api/api.ts` | Account (`GET`/`PATCH`), signup, self-service key management, credit history, and template routes |
| `src/api/jobs.ts` | Job routes and credit reconciliation (`computeJobCredits`) |
| `src/api/accounts.ts` | Account model, API key issuance/revocation, `requireApiKey` + `getAccountFromRequest`, signup rate-limiting |
| `src/api/api-util.ts` | Shared helpers: `apiError`, `apiJson`, `asyncHandler`, `parsePagination`, `effectToLamports` / `lamportsToEffect` |
| `src/api/ledger.ts` | Credit balance + audit log (`debit` / `refund` / `getBalance` / `listLedgerEntries`) |
| `src/api/admin.ts` | Admin UI (HTMX, cookie auth) |
| `src/templates.ts` | Template storage, content-addressing, rendering, approval |
| `src/fetcher.ts` | Dataset/Fetcher model — the underlying task machinery that jobs use |
| `public/api-console.html` | Self-contained browser console (no build step) |

### Job internal model

A `Job` is a thin record that maps to a hidden `Dataset` + one `Fetcher`
(both set `hidden: true` so they do not appear on internal dashboards).
Task posting, worker assignment, and result collection all go through the
existing Fetcher machinery — the API layer only adds accounting and access
control.

```
Job record
  ├── Dataset (hidden: true)
  └── Fetcher (engine: "effectai")
        ↓ posts tasks on a timer
      Task queue → workers → results
```

On cancel, both the Dataset and Fetcher are set to `status: "archived"`,
which stops the poster loop from importing more tasks.

### Credit accounting

Credits are computed live from task completion counts — they are not mutated
inside the polling loop. `computeJobCredits(job, completedCount)` is the single
source of truth:

```
reserved  = rewardLamports x taskCount        (set at creation, never changes)
consumed  = rewardLamports x completedCount   (derived on every read)
refunded  = job.refundedLamports              (set once on cancel, then frozen)
remaining = reserved - consumed - refunded    (clamped to 0)
```

On cancel, `remaining` is computed once, `refund()` is called with that amount,
and `job.refundedLamports` / `job.consumedLamports` are frozen. If job creation
fails after the initial debit, the catch block calls `refund()` automatically.

### Template approval and trust

`isTemplateApproved(tpl)` returns `true` if `tpl.approved === true` OR
`tpl.ownerId` is absent (team-authored templates in the default catalog).

The poster injects `__effectApproved: true/false` into each task's
`templateData` before posting to the manager. The worker app uses this flag to
decide whether to display a sandbox warning. The `/results` endpoint strips
`__effectApproved` before returning data to the requestor so it does not leak
into results.

### Template lifecycle (archival)

`archiveTemplate(id)` in `templates.ts` flips a template's `status` to
`"archived"`. Archived templates are filtered out of `GET /templates`,
`getPublicApprovedTemplates()`, and `resolveUsableTemplate()` (so they can't
back new jobs); already-running jobs are untouched because their tasks are
already imported and the manager resolves template HTML by content-addressed
ID. Archival is **reversible**: `registerTemplate()` always writes
`status: "active"`, so re-submitting identical HTML revives the template.

`DELETE /api/v1/templates/:id` does not use the `requireApiKey` middleware;
instead it resolves credentials inside the handler via `getAccountFromRequest()`
(API key) and `hasAuth()` (admin cookie). It authorizes the template's
`ownerId` **or** a logged-in team admin — the admin may archive any template,
the owner only their own. Public-catalog templates (no `ownerId`) are therefore
owner-unreachable and admin-only.

### `uniqueWorker` enforcement

When `uniqueWorker: true` is set on a job:

1. The Fetcher is created with `repetitions: 1` — the manager enforces
   this cap per worker per batch.
2. `fetcher.batchId` is pinned to the `jobId` (a stable string). Normally
   each import cycle generates a fresh `batchId = ulid()`, which resets the
   per-worker cap on every cycle. Pinning it means the cap spans the entire
   job lifetime, so a worker who already completed one task in batch 1 is
   correctly excluded from batch 2, 3, etc.

This is especially important for `constant` jobs, which import tasks in
many small batches as the target queue drains.

### Template preview

`GET /api/v1/templates/:id/preview` renders the template HTML server-side with
sample data (`{field: field}` for each field) and returns the rendered string.
The API console loads this into a sandboxed iframe (`sandbox="allow-scripts
allow-forms allow-modals allow-popups allow-pointer-lock"`, no
`allow-same-origin`) so even untrusted template HTML cannot reach the page
origin. The Preview button appears on every row of the template list.

### Signup rate limiting

`checkSignupRateLimit(ip)` in `accounts.ts` is an in-memory bucket: 3 accounts
per IP per 24 hours, keyed by the raw request IP. The bucket resets
automatically at the stored `resetAt` timestamp. This is the primary abuse
guard alongside the zero starting credit balance (new accounts cannot post tasks
until topped up).

### Pagination

`parsePagination(query, { defaultLimit, maxLimit })` in `api-util.ts` is the
single place limit/offset are parsed and clamped (`limit ∈ [1, maxLimit]`,
`offset ≥ 0`). All list endpoints (`/jobs`, `/templates`, `/results`,
`/credits/transactions`) use it and return a `total` alongside the page.
`@cross/kv`'s `db.count(prefix)` supplies the total cheaply where the full list
isn't already in memory (`/results`, `/credits/transactions`); `/jobs` and
`/templates` derive it from the in-memory list length. KV has no native offset,
so the page is taken by over-fetching `offset + limit` then slicing.

### Self-service key management & last-key guard

`GET/POST/DELETE /api/v1/keys` wire up the existing `listApiKeys` /
`issueApiKey` / `revokeApiKey`, scoped to the caller's account (`DELETE` 404s on
a hash that isn't theirs, so key hashes never leak across accounts). The raw key
is returned only by `POST`. Revoking the **last** active key would lock the
account out (a valid key is needed to issue a new one), so when
`countActiveApiKeys(account.id) <= 1` the handler requires `confirm=DELETE`
(query or body) and otherwise returns `400`.

**Temporary single-key cap.** `POST /api/v1/keys` is intentionally gated to one
active key per account for now: if `countActiveApiKeys(account.id) >= 1` it
returns `403 forbidden`. The underlying machinery is fully multi-key
(issue/list/revoke all work unchanged), so lifting the limit is a one-line
change — delete the guard marked `TEMPORARY` at the top of the
`POST /api/v1/keys` handler. No data migration is needed when it's unlocked.

### Adding fields to `Job`

- Add the field to the `Job` type in `jobs.ts`.
- Parse it from `req.body` inside `analyzeJob()`.
- Thread it through the `JobAnalysis` success branch.
- Expose it via `jobView()` (what gets serialised to API responses).
- Add it with a default value to the `baseJob()` fixture in `jobs.spec.ts`.
