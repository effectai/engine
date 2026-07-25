import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { archiveTemplate, getTemplate, type TemplateRecord } from "./templates.js";
import { db } from "./state.js";

const dir = mkdtempSync(join(tmpdir(), "templates-test-"));

beforeAll(async () => {
  await db.open(join(dir, "test.db"));
});

afterAll(async () => {
  await db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("archiveTemplate", () => {
  it("flips status to archived and persists", async () => {
    const record: TemplateRecord = {
      createdAt: Date.now(),
      name: "Sample",
      templateId: "tpl-1",
      data: "<h1>${product}</h1>",
      status: "active",
      ownerId: "owner-1",
    };
    await db.set(["templates", record.templateId], record);

    const archived = await archiveTemplate("tpl-1");
    expect(archived?.status).toBe("archived");
    expect((await getTemplate("tpl-1"))?.data.status).toBe("archived");
  });

  it("returns null for an unknown template", async () => {
    expect(await archiveTemplate("does-not-exist")).toBeNull();
  });
});
