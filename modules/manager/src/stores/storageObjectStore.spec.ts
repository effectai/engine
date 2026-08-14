import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { LevelDatastore } from "datastore-level";
import { promises } from "node:fs";
import { createStorageObjectStore } from "./storageObjectStore.js";
import { createHash } from "node:crypto";

const TEST_DIR = "/tmp/storage-object-store-test";

const hash = (data: Uint8Array) =>
  createHash("sha256").update(data).digest("hex");

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

  describe("put / get", () => {
    it("round-trips raw bytes", async () => {
      const data = new TextEncoder().encode("hello storage");
      const objectHash = hash(data);

      await store.put({ hash: objectHash, data, owner: "peer1" });

      expect(await store.has(objectHash)).toBe(true);
      const stored = await store.get(objectHash);
      expect(new Uint8Array(stored!)).toEqual(data);
    });

    it("stores the owner and a timestamp in metadata", async () => {
      const data = new Uint8Array([1, 2, 3]);
      const objectHash = hash(data);
      const before = Math.floor(Date.now() / 1000);

      await store.put({ hash: objectHash, data, owner: "peer1" });

      const meta = await store.getMeta(objectHash);
      expect(meta?.owner).toBe("peer1");
      expect(meta?.timestamp).toBeGreaterThanOrEqual(before);
    });
  });

  describe("getMeta / get / has for missing keys", () => {
    it("returns null / false for unknown hashes", async () => {
      expect(await store.has("nonexistent")).toBe(false);
      expect(await store.getMeta("nonexistent")).toBeNull();
      expect(await store.get("nonexistent")).toBeNull();
    });
  });

  describe("delete", () => {
    it("removes both data and metadata", async () => {
      const data = new Uint8Array([9, 8, 7]);
      const objectHash = hash(data);

      await store.put({ hash: objectHash, data, owner: "peer1" });
      await store.delete(objectHash);

      expect(await store.has(objectHash)).toBe(false);
      expect(await store.getMeta(objectHash)).toBeNull();
      expect(await store.get(objectHash)).toBeNull();
    });
  });
});
