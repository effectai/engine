import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Fetcher, getTasks } from "./fetcher.js";
import { db } from "./state.js";
import type { TemplateRecord } from "./templates.js";

const dir = mkdtempSync(join(tmpdir(), "fetcher-test-"));

beforeAll(async () => {
  await db.open(join(dir, "t.db"));
});
afterAll(async () => {
  await db.close();
  rmSync(dir, { recursive: true, force: true });
});

const putTemplate = (id: string, extra: Partial<TemplateRecord>) =>
  db.set<TemplateRecord>(["templates", id], {
    templateId: id,
    name: id,
    data: "<p>${x}</p>",
    status: "active",
    createdAt: 0,
    ...extra,
  });

const csvFetcher = (templateId: string): Fetcher => ({
  lastImport: undefined,
  datasetId: 1,
  index: 1,
  type: "csv",
  capabilities: [""],
  engine: "effectai",
  name: "t",
  price: 1000,
  frequency: 1,
  batchSize: 10,
  template: templateId,
  timeLimitSeconds: 600,
  taskIdx: 0,
  totalTasks: 0,
  status: "active",
});

const approvedFlagOf = (templateDataJson: string): unknown =>
  JSON.parse(templateDataJson).__effectApproved;

describe("getTasks injects the template trust flag", () => {
  it("approved (team/public) template → __effectApproved: true", async () => {
    await putTemplate("tpl-approved", {}); // no ownerId = team = approved
    const tasks = await getTasks(csvFetcher("tpl-approved"), "x\n1\n2");
    expect(tasks).toHaveLength(2);
    expect(approvedFlagOf(tasks[0].templateData)).toBe(true);
    expect(JSON.parse(tasks[0].templateData).x).toBe("1"); // row data preserved
  });

  it("unapproved custom template → __effectApproved: false", async () => {
    await putTemplate("tpl-unapproved", { ownerId: "acct1", approved: false });
    const tasks = await getTasks(csvFetcher("tpl-unapproved"), "x\n1");
    expect(approvedFlagOf(tasks[0].templateData)).toBe(false);
  });

  it("missing template → defaults to safe (true)", async () => {
    const tasks = await getTasks(csvFetcher("does-not-exist"), "x\n1");
    expect(approvedFlagOf(tasks[0].templateData)).toBe(true);
  });
});
