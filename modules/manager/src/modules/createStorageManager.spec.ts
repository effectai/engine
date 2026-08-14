import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { LevelDatastore } from "datastore-level";
import { promises } from "node:fs";
import { createHash } from "node:crypto";
import type { PeerId } from "@libp2p/interface";
import {
  computeObjectHash,
  createStorageManager,
} from "./createStorageManager.js";
import { createStorageObjectStore } from "../stores/storageObjectStore.js";

const TEST_DIR = "/tmp/storage-manager-test";

const ownerBytes = (id: string): Uint8Array =>
  createHash("sha256").update(id).digest();

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
      expect(computeObjectHash(data)).toBe(
        "ada7ad17eeff1826bdf1e69d6a70d542548a6f0a3c3809748a36076d97671047",
      );
    });

    it("is deterministic", () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(computeObjectHash(data)).toBe(computeObjectHash(data));
    });
  });

  describe("handleStoreObject", () => {
    it("stores type-0 (raw) data and returns its content hash", async () => {
      const response = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("payload"), type: 0 },
        { peerId: peer("peer1") },
      );

      const hash = response.storeObjectResponse.hash;
      const gotten = await storageManager.handleGetObject({ hash });
      expect(gotten.getObjectResponse.items).toHaveLength(1);
      const item = gotten.getObjectResponse.items[0];
      expect(item.type).toBe(0);
      expect(new Uint8Array(item.data)).toEqual(new TextEncoder().encode("payload"));
    });

    it("stores type-1 (linked list) data with next pointer", async () => {
      const first = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("first"), type: 0 },
        { peerId: peer("peer1") },
      );

      const second = await storageManager.handleStoreObject(
        {
          data: new TextEncoder().encode("second"),
          type: 1,
          next: first.storeObjectResponse.hash,
        },
        { peerId: peer("peer1") },
      );

      expect(second.storeObjectResponse.hash).toBeTruthy();
      expect(second.storeObjectResponse.hash).not.toBe(
        first.storeObjectResponse.hash,
      );
    });

    it("downgrades type-1 to type-0 when no next is provided", async () => {
      const response = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("foo"), type: 1 },
        { peerId: peer("peer1") },
      );

      const hash = response.storeObjectResponse.hash;
      const gotten = await storageManager.handleGetObject({ hash });
      expect(gotten.getObjectResponse.items[0].type).toBe(0);
    });

    it("returns the same hash for identical data stored twice by the same peer", async () => {
      const data = new TextEncoder().encode("dedupe");
      const first = await storageManager.handleStoreObject(
        { data, type: 0 },
        { peerId: peer("peer1") },
      );
      const second = await storageManager.handleStoreObject(
        { data, type: 0 },
        { peerId: peer("peer1") },
      );
      expect(second.storeObjectResponse.hash).toBe(
        first.storeObjectResponse.hash,
      );
    });

    it("returns a different hash for the same data stored by a different peer", async () => {
      const data = new TextEncoder().encode("mine");
      const first = await storageManager.handleStoreObject(
        { data, type: 0 },
        { peerId: peer("peer1") },
      );
      const second = await storageManager.handleStoreObject(
        { data, type: 0 },
        { peerId: peer("peer2") },
      );
      expect(second.storeObjectResponse.hash).not.toBe(
        first.storeObjectResponse.hash,
      );
    });
  });

  describe("handleGetObject", () => {
    it("returns the stored item for type-0 data", async () => {
      const data = new TextEncoder().encode("fetch me");
      const storeResp = await storageManager.handleStoreObject(
        { data, type: 0 },
        { peerId: peer("peer1") },
      );
      const hash = storeResp.storeObjectResponse.hash;

      const response = await storageManager.handleGetObject({ hash });
      expect(response.getObjectResponse.items).toHaveLength(1);
      const item = response.getObjectResponse.items[0];
      expect(new Uint8Array(item.data)).toEqual(data);
      expect(item.type).toBe(0);
      expect(new Uint8Array(item.owner)).toEqual(new Uint8Array(ownerBytes("peer1")));
    });

    it("follows next pointers for type-1 linked lists", async () => {
      // A (type 0, tail) → B (type 1, next=hashA)
      const aResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("A"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hashA = aResp.storeObjectResponse.hash;

      const bResp = await storageManager.handleStoreObject(
        {
          data: new TextEncoder().encode("B"),
          type: 1,
          next: hashA,
        },
        { peerId: peer("peer1") },
      );
      const hashB = bResp.storeObjectResponse.hash;

      const response = await storageManager.handleGetObject({ hash: hashB });
      expect(response.getObjectResponse.items).toHaveLength(2);
      expect(response.getObjectResponse.items[0].hash).toBe(hashB);
      expect(response.getObjectResponse.items[1].hash).toBe(hashA);
    });

    it("respects the limit parameter", async () => {
      // A → B → C (head)
      const aResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("A"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hashA = aResp.storeObjectResponse.hash;

      const bResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("B"), type: 1, next: hashA },
        { peerId: peer("peer1") },
      );
      const hashB = bResp.storeObjectResponse.hash;

      await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("C"), type: 1, next: hashB },
        { peerId: peer("peer1") },
      );
      // hashC is the head

      // Can't get hashC cleanly without storing it
      // So store it directly for the test
      const cResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("C"), type: 1, next: hashB },
        { peerId: peer("peer1") },
      );
      const hashC = cResp.storeObjectResponse.hash;

      // Limit 2 → get [C, B]
      const response = await storageManager.handleGetObject({
        hash: hashC,
        limit: 2,
      });
      expect(response.getObjectResponse.items).toHaveLength(2);
      expect(response.getObjectResponse.items[0].hash).toBe(hashC);
      expect(response.getObjectResponse.items[1].hash).toBe(hashB);
    });

    it("defaults limit to 10", async () => {
      const aResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("A"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hashA = aResp.storeObjectResponse.hash;

      const bResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("B"), type: 1, next: hashA },
        { peerId: peer("peer1") },
      );
      const hashB = bResp.storeObjectResponse.hash;

      const response = await storageManager.handleGetObject({ hash: hashB });
      expect(response.getObjectResponse.items).toHaveLength(2);
    });

    it("stops at a node with type 0 (end of chain)", async () => {
      const aResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("A"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hashA = aResp.storeObjectResponse.hash;

      const response = await storageManager.handleGetObject({ hash: hashA });
      expect(response.getObjectResponse.items).toHaveLength(1);
      expect(response.getObjectResponse.items[0].hash).toBe(hashA);
      expect(response.getObjectResponse.items[0].next).toBe("");
    });

    it("throws when the hash is unknown", async () => {
      await expect(
        storageManager.handleGetObject({ hash: "nonexistent" }),
      ).rejects.toThrow("Object not found");
    });
  });

  describe("handleDeleteObject", () => {
    it("deletes a type-0 object when called by the owner", async () => {
      const storeResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("delete me"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hash = storeResp.storeObjectResponse.hash;

      await storageManager.handleDeleteObject(
        { hash },
        { peerId: peer("peer1") },
      );

      await expect(
        storageManager.handleGetObject({ hash }),
      ).rejects.toThrow("Object not found");
    });

    it("cascade-deletes the full linked list when called by the owner", async () => {
      // A (type 0) → B (type 1, next=hashA)
      const aResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("A"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hashA = aResp.storeObjectResponse.hash;

      const bResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("B"), type: 1, next: hashA },
        { peerId: peer("peer1") },
      );
      const hashB = bResp.storeObjectResponse.hash;

      // Delete head B → should cascade to A
      await storageManager.handleDeleteObject(
        { hash: hashB },
        { peerId: peer("peer1") },
      );

      await expect(
        storageManager.handleGetObject({ hash: hashB }),
      ).rejects.toThrow("Object not found");
      await expect(
        storageManager.handleGetObject({ hash: hashA }),
      ).rejects.toThrow("Object not found");
    });

    it("throws when called by a non-owner", async () => {
      const storeResp = await storageManager.handleStoreObject(
        { data: new TextEncoder().encode("mine"), type: 0 },
        { peerId: peer("peer1") },
      );
      const hash = storeResp.storeObjectResponse.hash;

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