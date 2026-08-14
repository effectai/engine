import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { LevelDatastore } from "datastore-level";
import { promises } from "node:fs";
import { createStorageObjectStore } from "./storageObjectStore.js";

const TEST_DIR = "/tmp/storage-object-store-test";

describe("createStorageObjectStore", () => {
  let datastore: LevelDatastore;
  let store: ReturnType<typeof createStorageObjectStore>;

  beforeEach(async () => {
    await promises.rm(TEST_DIR, { recursive: true, force: true });
    datastore = new LevelDatastore(TEST_DIR);
    await datastore.open();
    store = createStorageObjectStore({ datastore });
  });

  afterEach(async () => {
    await datastore.close();
    await promises.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("round-trips data bytes and metadata", async () => {
    const hash = "abc123";
    const data = new TextEncoder().encode("hello storage");
    const meta = { type: 0, owner: "ff".repeat(32), next: "" };

    await store.put(hash, data);
    await store.putMeta(hash, meta);

    expect(await store.has(hash)).toBe(true);
    expect(new Uint8Array((await store.get(hash))!)).toEqual(data);
    expect(await store.getMeta(hash)).toEqual(meta);
  });

  it("returns null for unknown hashes", async () => {
    expect(await store.has("nonexistent")).toBe(false);
    expect(await store.get("nonexistent")).toBeNull();
    expect(await store.getMeta("nonexistent")).toBeNull();
  });

  it("removes both data and metadata on delete", async () => {
    const hash = "to-delete";
    const data = new Uint8Array([9, 8, 7]);
    const meta = { type: 0, owner: "00".repeat(32), next: "" };

    await store.put(hash, data);
    await store.putMeta(hash, meta);
    await store.delete(hash);

    expect(await store.has(hash)).toBe(false);
    expect(await store.get(hash)).toBeNull();
    expect(await store.getMeta(hash)).toBeNull();
  });
});