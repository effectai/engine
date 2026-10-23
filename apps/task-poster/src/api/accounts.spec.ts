import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  countActiveApiKeys,
  createAccount,
  getAccount,
  getApiKey,
  issueApiKey,
  listApiKeys,
  revokeApiKey,
  updateAccount,
} from "./accounts.js";
import { db } from "../state.js";

const dir = mkdtempSync(join(tmpdir(), "accounts-test-"));

beforeAll(async () => {
  await db.open(join(dir, "test.db"));
});

afterAll(async () => {
  await db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("updateAccount", () => {
  it("partially updates fields and clears email with an empty string", async () => {
    const account = await createAccount("Acme", "a@acme.com");

    const renamed = await updateAccount(account.id, { name: "Acme Inc" });
    expect(renamed.name).toBe("Acme Inc");
    expect(renamed.email).toBe("a@acme.com"); // untouched when omitted

    const cleared = await updateAccount(account.id, { email: "" });
    expect(cleared.email).toBeUndefined(); // "" clears it
    expect(cleared.name).toBe("Acme Inc"); // untouched when omitted

    expect((await getAccount(account.id))?.name).toBe("Acme Inc"); // persisted
  });
});

describe("self-service key management", () => {
  it("issues, scopes, counts, and revokes keys", async () => {
    const account = await createAccount("Keyholder");
    expect(await countActiveApiKeys(account.id)).toBe(0);

    const { key, record } = await issueApiKey(account.id);
    expect(key.startsWith("eff_live_")).toBe(true);
    expect(await countActiveApiKeys(account.id)).toBe(1);

    const fetched = await getApiKey(record.hash);
    expect(fetched?.accountId).toBe(account.id);
    expect(fetched?.status).toBe("active");

    await issueApiKey(account.id);
    expect((await listApiKeys(account.id)).length).toBe(2);
    expect(await countActiveApiKeys(account.id)).toBe(2);

    await revokeApiKey(record.hash);
    expect((await getApiKey(record.hash))?.status).toBe("revoked");
    expect(await countActiveApiKeys(account.id)).toBe(1); // revoked no longer counts
  });

  it("lists only the caller's keys", async () => {
    const account = await createAccount("Scoped");
    await issueApiKey(account.id);
    const other = await createAccount("Other");
    await issueApiKey(other.id);

    const scoped = await listApiKeys(account.id);
    expect(scoped.length).toBe(1);
    expect(scoped.every((entry) => entry.accountId === account.id)).toBe(true);
  });
});
