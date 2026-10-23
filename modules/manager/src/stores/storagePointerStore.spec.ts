import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { LevelDatastore } from "datastore-level";
import { promises } from "node:fs";
import { createStoragePointerStore } from "./storagePointerStore.js";

const TEST_DIR = "/tmp/storage-pointer-store-test";

describe("createStoragePointerStore", () => {
  let datastore: LevelDatastore;
  let store: ReturnType<typeof createStoragePointerStore>;

  beforeEach(async () => {
    await promises.rm(TEST_DIR, { recursive: true, force: true });
    datastore = new LevelDatastore(TEST_DIR);
    await datastore.open();
    store = createStoragePointerStore({ datastore });
  });

  afterEach(async () => {
    await datastore.close();
    await promises.rm(TEST_DIR, { recursive: true, force: true });
  });

  it("round-trips a pointer through set + get", async () => {
    const overwritten = await store.setPointer("owner1", "latest", "hashA");
    expect(overwritten).toBe(false);

    expect(await store.getPointer("owner1", "latest")).toEqual({
      key: "latest",
      value: "hashA",
    });
  });

  it("returns null for an unknown pointer", async () => {
    expect(await store.getPointer("owner1", "nope")).toBeNull();
  });

  it("overwrites an existing pointer", async () => {
    await store.setPointer("owner1", "latest", "hashA");
    const overwritten = await store.setPointer("owner1", "latest", "hashB");
    expect(overwritten).toBe(true);
    expect(await store.getPointer("owner1", "latest")).toEqual({
      key: "latest",
      value: "hashB",
    });
  });

  it("namespaces pointers per owner", async () => {
    await store.setPointer("owner1", "mine", "hashP1");
    await store.setPointer("owner2", "mine", "hashP2");

    expect(await store.getPointer("owner1", "mine")).toEqual({
      key: "mine",
      value: "hashP1",
    });
    expect(await store.getPointer("owner2", "mine")).toEqual({
      key: "mine",
      value: "hashP2",
    });
  });

  describe("compareAndSetPointer", () => {
    it("updates when expected matches the current value", async () => {
      await store.setPointer("owner1", "latest", "hashA");

      const res = await store.compareAndSetPointer(
        "owner1",
        "latest",
        "hashA",
        "hashB",
      );
      expect(res).toEqual({ updated: true, current: "hashB" });
      expect(await store.getPointer("owner1", "latest")).toEqual({
        key: "latest",
        value: "hashB",
      });
    });

    it("rejects when expected mismatches and leaves the value unchanged", async () => {
      await store.setPointer("owner1", "latest", "hashA");

      const res = await store.compareAndSetPointer(
        "owner1",
        "latest",
        "stale",
        "hashB",
      );
      expect(res).toEqual({ updated: false, current: "hashA" });
      expect(await store.getPointer("owner1", "latest")).toEqual({
        key: "latest",
        value: "hashA",
      });
    });

    it("rejects when the pointer does not exist", async () => {
      const res = await store.compareAndSetPointer(
        "owner1",
        "missing",
        "hashA",
        "hashB",
      );
      expect(res).toEqual({ updated: false, current: null });
      expect(await store.getPointer("owner1", "missing")).toBeNull();
    });

    it("serializes concurrent CAS so only one wins", async () => {
      await store.setPointer("owner1", "latest", "hashA");

      // Two concurrent updates both expecting hashA — exactly one must win.
      const [r1, r2] = await Promise.all([
        store.compareAndSetPointer("owner1", "latest", "hashA", "hashB"),
        store.compareAndSetPointer("owner1", "latest", "hashA", "hashC"),
      ]);

      const winners = [r1, r2].filter((r) => r.updated).length;
      expect(winners).toBe(1);

      const current = (await store.getPointer("owner1", "latest"))!.value;
      expect(["hashB", "hashC"]).toContain(current);
      // The loser observed the winner's value as `current`.
      const loser = [r1, r2].find((r) => !r.updated)!;
      expect(loser.current).toBe(current);
    });
  });

  describe("deletePointer", () => {
    it("deletes an existing pointer and returns true", async () => {
      await store.setPointer("owner1", "gone", "hashA");
      expect(await store.deletePointer("owner1", "gone")).toBe(true);
      expect(await store.getPointer("owner1", "gone")).toBeNull();
    });

    it("returns false for an unknown pointer", async () => {
      expect(await store.deletePointer("owner1", "nope")).toBe(false);
    });
  });

  describe("listPointers", () => {
    it("lists all pointers for an owner", async () => {
      await store.setPointer("owner1", "a", "hashA");
      await store.setPointer("owner1", "b", "hashB");
      await store.setPointer("owner2", "c", "hashC");

      const p1 = await store.listPointers("owner1");
      const p2 = await store.listPointers("owner2");

      expect(p1.map((p) => p.key).sort()).toEqual(["a", "b"]);
      expect(p2.map((p) => p.key)).toEqual(["c"]);
    });

    it("returns an empty list for an owner with no pointers", async () => {
      expect(await store.listPointers("nobody")).toEqual([]);
    });
  });
});