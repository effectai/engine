import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { LevelDatastore } from "datastore-level";
import { promises } from "node:fs";
import type { PeerId } from "@libp2p/interface";
import {
  computeObjectHash,
  createStorageManager,
} from "./createStorageManager.js";
import { createStorageObjectStore } from "../stores/storageObjectStore.js";

const TEST_DIR = "/tmp/storage-manager-test";

const peer = (id: string) => ({ toString: () => id }) as PeerId;

describe("createStorageManager", () => {
  let datastore: LevelDatastore;
  let storageManager: ReturnType<typeof createStorageManager>;

  beforeEach(async () => {
    await promises.rm(TEST_DIR, { recursive: true, force: true });
    datastore = new LevelDatastore(TEST_DIR);
    await datastore.open();
    storageManager = createStorageManager({
      storageStore: createStorageObjectStore({ datastore }),
    });
  });

  afterEach(async () => {
    await datastore.close();
    await promises.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("computeObjectHash", () => {
    it("returns the sha256 hex digest of the data", () => {
      const data = new TextEncoder().encode("hello storage");
      const expected =
        "ada7ad17eeff1826bdf1e69d6a70d542548a6f0a3c3809748a36076d97671047";
      expect(computeObjectHash(data)).toBe(expected);
    });

    it("is deterministic", () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(computeObjectHash(data)).toBe(computeObjectHash(data));
    });
  });

  describe("handleStoreObject", () => {
    it("stores the object and returns its content hash", async () => {
      const data = new TextEncoder().encode("payload");
      const expectedHash = computeObjectHash(data);

      const response = await storageManager.handleStoreObject(
        { data },
        { peerId: peer("peer1") },
      );

      expect(response).toEqual({ storeObjectResponse: { hash: expectedHash } });
    });

    it("keeps the original owner when the same content is stored again", async () => {
      const data = new TextEncoder().encode("dedupe me");

      await storageManager.handleStoreObject({ data }, { peerId: peer("peer1") });

      // a different peer stores the identical bytes
      const response = await storageManager.handleStoreObject(
        { data },
        { peerId: peer("peer2") },
      );

      const objectHash = response.storeObjectResponse.hash;
      const stored = await storageManager.handleGetObject({ hash: objectHash });
      expect(stored.getObjectResponse.owner).toBe("peer1");
    });
  });

  describe("handleGetObject", () => {
    it("returns the stored data and owner", async () => {
      const data = new TextEncoder().encode("fetch me");

      await storageManager.handleStoreObject({ data }, { peerId: peer("peer1") });

      const hash = computeObjectHash(data);
      const response = await storageManager.handleGetObject({ hash });

      expect(new Uint8Array(response.getObjectResponse.data)).toEqual(data);
      expect(response.getObjectResponse.owner).toBe("peer1");
    });

    it("throws when the hash is unknown", async () => {
      await expect(
        storageManager.handleGetObject({ hash: "nonexistent" }),
      ).rejects.toThrow("Object not found");
    });
  });

  describe("handleDeleteObject", () => {
    it("deletes the object when called by the owner", async () => {
      const data = new TextEncoder().encode("delete me");

      await storageManager.handleStoreObject({ data }, { peerId: peer("peer1") });

      const hash = computeObjectHash(data);
      await storageManager.handleDeleteObject(
        { hash },
        { peerId: peer("peer1") },
      );

      await expect(
        storageManager.handleGetObject({ hash }),
      ).rejects.toThrow("Object not found");
    });

    it("throws when called by a non-owner", async () => {
      const data = new TextEncoder().encode("mine");

      await storageManager.handleStoreObject({ data }, { peerId: peer("peer1") });

      const hash = computeObjectHash(data);
      await expect(
        storageManager.handleDeleteObject({ hash }, { peerId: peer("peer2") }),
      ).rejects.toThrow("Only the owner can delete an object");
    });

    it("throws when the hash is unknown", async () => {
      await expect(
        storageManager.handleDeleteObject(
          { hash: "nonexistent" },
          { peerId: peer("peer1") },
        ),
      ).rejects.toThrow("Object not found");
    });
  });
});
