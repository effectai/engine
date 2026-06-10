# Effect AI — Requestor API (v1)

Post microtasks to the Effect AI network and retrieve their results
programmatically. You bring a CSV of inputs and a template; workers complete
one task per row; you poll for results.

> Status: v1. On-chain credit purchase and webhooks are not in v1 — credits are
> topped up by the Effect team, and results are retrieved by polling.

## Getting started

1. **Get an API key.** The Effect team creates your account, issues a key, and
   gives you a starting credit balance from the admin dashboard.
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
> below (paste your key, submit templates, create jobs from a CSV, view results)
> — no curl needed.

## Authentication

Every request needs your API key as a Bearer token:

```
Authorization: Bearer eff_live_xxxxxxxxxxxxxxxxxxxx
```

(`X-API-Key: <key>` is also accepted.) Keys are issued by the Effect team and
shown **once** — store them securely. A key maps to one account with a credit
balance.

## Base URL & versioning

All endpoints are under `/<host>/api/v1`. Breaking changes ship under a new
version prefix.

## Units

Rewards and balances are in **EFFECT** (the network token). `1 EFFECT =
1,000,000 lamports`. You pass `reward` as an EFFECT amount (e.g. `"0.5"`);
balances are also reported in EFFECT.

## Credits

- **Cost of a job** = `reward × number of tasks`, debited up front.
- Tasks that never get a submission (e.g. on cancel) are **refunded**.
- The team tops up your balance manually for now.

## Errors

Non-2xx responses use a consistent envelope:

```json
{ "error": { "code": "insufficient_credits", "message": "Insufficient credits: need 2000000 lamports, have 500000." } }
```

Codes: `unauthorized` (401), `forbidden` (403), `not_found` (404),
`invalid_request` (400), `insufficient_credits` (402), `rate_limited` (429),
`internal` (500).

## Rate limits

120 requests/minute per key. Responses include `X-RateLimit-Limit` and
`X-RateLimit-Remaining`; over the limit returns `429 rate_limited`.

---

## Endpoints

### `GET /api/v1/account`

Your account and credit balance.

```bash
curl https://HOST/api/v1/account -H "Authorization: Bearer $KEY"
```
```json
{ "id": "01J…", "name": "Acme", "status": "active",
  "credits": { "balance": "12500000", "currency": "EFFECT", "lamportsPerEffect": 1000000 } }
```

### `GET /api/v1/templates`

Templates you can use: the team's approved default catalog plus your own.

```json
{ "templates": [
  { "templateId": "478b…", "name": "Sentiment",
    "fields": ["product", "question"], "approved": true, "owned": true }
] }
```
- `fields` — the `${...}` placeholders the template expects; your CSV must have a
  column for each.
- `approved` — whether the Effect team reviewed it (workers see a "safe" badge).

### `POST /api/v1/templates`

Submit a custom template (HTML with `${field}` placeholders).

```bash
curl -X POST https://HOST/api/v1/templates -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Sentiment",
        "html": "<h1>Rate ${product}</h1><p>${question}</p>",
        "requestApproval": true }'
```
- `requestApproval: true` queues it for team review. Either way it's usable
  immediately; unapproved templates run sandboxed and show workers a caution
  badge until approved.

### `POST /api/v1/jobs/estimate`

Validate + price a job without charging.

```json
{ "type": "csv", "taskCount": 3, "rewardPerTask": "0.5",
  "cost": "1.5", "currency": "EFFECT", "balance": "8.5", "sufficient": true }
```

### `POST /api/v1/jobs`

Create a job. Debits `reward × tasks` up front.

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

**Constant / survey job** — the *same* inputs go to up to `maxTasks` different
workers (one task each). Use it to gather many independent answers to one
question: polls, A/B preference, redundant labelling.
```bash
-d '{ "type": "constant", "templateId": "478b…", "reward": "0.2",
      "maxTasks": 100, "data": { "product": "Widget", "question": "Good?" } }'
```
- `maxTasks` (required) — how many workers answer it; **cost = `reward × maxTasks`**.
- `data` — the values for the template's `${fields}`, as a JSON object (a
  JSON-encoded string is also accepted). The same `data` is shown to every worker.

**Common fields** (both types): `templateId` (required), `reward` (EFFECT,
required), `name`, `capability`, `timeLimitSeconds` (default 600). For `csv`,
send the CSV as a string in the `csv` field; it must cover every template field
and must not include a `dataffect/reward` column. Limits: ≤ 10,000 tasks/job;
reward 0.001–100 EFFECT; ≤ 1,000,000 EFFECT/job.

Returns the job (see status shape below) with `201`.

### `GET /api/v1/jobs` · `GET /api/v1/jobs/:id`

List your jobs / one job's status.

```json
{ "id": "01J…", "name": "Label images", "type": "csv", "status": "active",
  "templateId": "478b…", "reward": "0.5", "taskCount": 3,
  "tasks": { "queued": 1, "active": 1, "completed": 1, "failed": 0 },
  "credits": { "currency": "EFFECT", "reserved": "1.5", "consumed": "0.5",
               "refunded": "0", "remaining": "1" } }
```

### `GET /api/v1/jobs/:id/results`

Completed results for your job (newest first). `?limit=` (≤1000, default 100),
`?offset=`, `?format=csv`.

```json
{ "jobId": "01J…", "count": 1, "limit": 100, "offset": 0, "results": [
  { "taskId": "01K…", "submittedAt": 1759534321,
    "worker": "12D3Koo…", "input": { "product": "Widget", "question": "Good?" },
    "result": "{\"answer\":\"yes\"}" } ] }
```

### `POST /api/v1/jobs/:id/cancel`

Stop a job: no more tasks are posted, and credits for unfinished tasks are
refunded. Returns the updated job.

---

## Pipeline / chained jobs (planned — not in v1)

> ⚠️ **Not implemented yet.** This is the intended design so integrators can plan
> for it. Today the API supports `csv` and `constant` only; `pipeline` is
> rejected. The underlying task engine already runs pipelines internally — the
> open work is exposing them safely to external accounts (chiefly the credit
> model, below).

A **pipeline job** feeds the *results of one of your jobs* into another job as
its inputs — e.g. job A collects raw labels, then job B (a different template)
has other workers **validate or aggregate** A's answers. This is "job chaining".

**Proposed request shape:**
```jsonc
POST /api/v1/jobs
{
  "type": "pipeline",
  "templateId": "<validation template>",
  "reward": "0.3",
  "sourceJobId": "01J…",   // an existing job you own; its completed results feed this one
  "filter": "^yes$",        // optional: only forward upstream results matching this regex
  "maxTasks": 500           // REQUIRED spend cap (see credits below)
}
```

**How inputs arrive.** Each completed task in `sourceJobId` mints one downstream
task. The upstream answer is forwarded to the new template as a small fixed
payload — the downstream template reads it via these placeholders:

| Placeholder | Meaning |
|---|---|
| `${result}` | the upstream worker's submitted answer (JSON string) |
| `${taskId}` | the upstream task id |
| `${submissionByPeer}` | the upstream worker (this worker is **excluded** from the downstream task, so a different person validates) |
| `${timestamp}` | when the upstream answer was submitted |

So a validation template typically renders `${result}` and asks "is this
correct?". Your downstream template's only required field is `${result}`.

**Credits (the hard part).** Every other job debits `reward × taskCount` up
front, but a pipeline's task count is **unknown at creation** — tasks appear over
time as the upstream job completes. The planned model keeps the existing
`reserved / consumed / refunded` counters but changes *when* they move:

- **Reserve a cap up front:** debit `reward × maxTasks` at creation. `maxTasks`
  is a hard ceiling on how many upstream results will be forwarded (and your max
  spend).
- **Consume per forwarded task:** each downstream completion consumes one
  `reward`, derived live from the done count (same as today).
- **Refund the remainder** when the pipeline is cancelled, the upstream job
  finishes with fewer than `maxTasks` results, or the `filter` drops results.

This bounds spend and reuses the current reconciliation math
(`computeJobCredits`) with no negative-balance risk.

**Constraints / open questions (to settle before building):**
- `sourceJobId` must be **owned by the same account**; results stay owner-scoped.
- Chaining depth — is B→C allowed (pipeline off a pipeline)? Likely yes, same rules.
- What happens to a pipeline whose source is cancelled mid-run (stop forwarding + refund).
- Whether to also accept a `constant` or `csv` job as a source, or only completed ones.

---

## Templates 101

A template is HTML rendered to the worker, with `${field}` placeholders filled
from each CSV row. Example for CSV columns `product,question`:

```html
<h1>How do you rate ${product}?</h1>
<p>${question}</p>
<button onclick="window.parent.postMessage({task:'submit', values:{answer:'yes'}}, '*')">Yes</button>
```

Workers submit by posting a `{ task: 'submit', values: … }` message; whatever you
put in `values` comes back as the `result`.

## Admin (Effect team only)

Account creation, key issuance, top-ups, and template approvals live behind the
team dashboard (cookie auth) at `/admin/accounts` and
`/admin/templates/pending` — not part of the public API.
