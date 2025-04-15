import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryDatastore } from "datastore-core";
import { Datastore, Key } from "interface-datastore";
import { createEntityStore } from "./store.js";

// Define test types
type TestEvent = {
  timestamp: number;
  type: string;
  data: Record<string, any>;
};

type TestEntityRecord = {
  id: string;
  events: TestEvent[];
  version: number;
};

describe("EntityStore Integration Tests", () => {
  let datastore: Datastore;
  let entityStore: ReturnType<
    typeof createEntityStore<TestEvent, TestEntityRecord>
  >;

  beforeEach(() => {
    // Use an in-memory datastore for testing
    datastore = new MemoryDatastore();
    entityStore = createEntityStore<TestEvent, TestEntityRecord>({
      datastore,
      defaultPrefix: "test-entities",
      parse: JSON.parse,
      stringify: JSON.stringify,
    });
  });

  describe("basic operations", () => {
    const testEntityId = "test-entity-1";
    const testRecord: TestEntityRecord = {
      id: testEntityId,
      events: [
        {
          type: "created",
          timestamp: Date.now(),
          data: { timestamp: Date.now() },
        },
      ],
      version: 1,
    };

    it("should store and retrieve an entity", async () => {
      // Initially should not exist
      expect(await entityStore.has({ entityId: testEntityId })).toBe(false);

      // Store the entity
      await entityStore.put({ entityId: testEntityId, record: testRecord });

      // Now should exist
      expect(await entityStore.has({ entityId: testEntityId })).toBe(true);

      // Retrieve and verify
      const retrieved = await entityStore.get({ entityId: testEntityId });
      expect(retrieved).toEqual(testRecord);
    });

    it("should update an existing entity", async () => {
      // Store initial version
      await entityStore.put({ entityId: testEntityId, record: testRecord });

      // Update the entity
      const updatedRecord = {
        ...testRecord,
        version: 2,
        events: [
          ...testRecord.events,
          { type: "updated", data: { field: "value" } },
        ],
      };
      await entityStore.put({ entityId: testEntityId, record: updatedRecord });

      // Retrieve and verify
      const retrieved = await entityStore.get({ entityId: testEntityId });
      expect(retrieved.version).toBe(2);
      expect(retrieved.events.length).toBe(2);
    });

    it("should delete an entity", async () => {
      // Store first
      await entityStore.put({ entityId: testEntityId, record: testRecord });
      expect(await entityStore.has({ entityId: testEntityId })).toBe(true);

      // Delete
      await entityStore.delete({ entityId: testEntityId });
      expect(await entityStore.has({ entityId: testEntityId })).toBe(false);
    });

    it("should throw when getting non-existent entity", async () => {
      await expect(
        entityStore.get({ entityId: "non-existent" }),
      ).rejects.toThrow();
    });
  });

  describe("query operations", () => {
    const testEntities = [
      {
        id: "entity-1",
        events: [{ type: "created", data: {} }],
        version: 1,
      },
      {
        id: "entity-2",
        events: [{ type: "created", data: {} }],
        version: 1,
      },
      {
        id: "entity-3",
        events: [{ type: "created", data: {} }],
        version: 1,
      },
    ];

    beforeEach(async () => {
      for (const entity of testEntities) {
        await entityStore.put({ entityId: entity.id, record: entity });
      }
    });

    it("should retrieve all entities", async () => {
      const all = await entityStore.all();
      expect(all.length).toBe(testEntities.length);
      expect(all.map((e) => e.id)).toEqual(
        expect.arrayContaining(testEntities.map((e) => e.id)),
      );
    });

    it("should only retrieve entities with the correct prefix", async () => {
      const entityIds = ["index/test-entity-4", "index/test-entity-5"];
      const entityRecords = entityIds.map((id) => ({
        id,
        events: [{ type: "created", data: {} }],
        version: 1,
      }));

      // Store entities with different prefix
      for (const entity of entityRecords) {
        await entityStore.put({ entityId: entity.id, record: entity });
      }

      // Should only get the original test entities
      const all = await entityStore.all();
      expect(all.length).toBe(5);

      const filtered = await entityStore.all({
        prefix: "test-entities/index",
      });
      expect(filtered.length).toBe(2);
    });
  });

  describe("rollback operations", () => {
    const testEntityId = "rollback-test-entity";
    const initialRecord: TestEntityRecord = {
      id: testEntityId,
      events: [
        { type: "created", timestamp: Date.now(), data: {} },
        { type: "updated", timestamp: Date.now(), data: { field: "value" } },
        {
          type: "published",
          timestamp: Date.now(),
          data: { timestamp: Date.now() },
        },
      ],
      version: 3,
    };

    beforeEach(async () => {
      await entityStore.put({ entityId: testEntityId, record: initialRecord });
    });

    it("should rollback last event", async () => {
      await entityStore.rollback({ entityId: testEntityId });

      const updated = await entityStore.get({ entityId: testEntityId });
      expect(updated.events.length).toBe(initialRecord.events.length - 1);
      expect(updated.events.map((e) => e.type)).not.toContain("published");
    });

    it("should rollback specific event", async () => {
      await entityStore.rollbackEvent({
        entityId: testEntityId,
        eventType: "published",
      });

      const updated = await entityStore.get({ entityId: testEntityId });
      expect(updated.events.length).toBe(initialRecord.events.length - 1);
      expect(updated.events.map((e) => e.type)).not.toContain("published");
    });

    it("should throw when rolling back with no events", async () => {
      const emptyEntityId = "empty-entity";
      await entityStore.put({
        entityId: emptyEntityId,
        record: {
          id: emptyEntityId,
          events: [],
          version: 1,
        },
      });

      await expect(
        entityStore.rollback({ entityId: emptyEntityId }),
      ).rejects.toThrow("No events to rollback");
    });

    it("should throw when rolling back non-existent event", async () => {
      await expect(
        entityStore.rollbackEvent({
          entityId: testEntityId,
          eventType: "non-existent",
        }),
      ).rejects.toThrow("Event not found");
    });
  });
});
