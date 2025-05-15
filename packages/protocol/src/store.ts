import { NotFoundError } from "@libp2p/interface";
import { Datastore, Key, QueryFilter } from "interface-datastore";

export interface BaseEvent {
  type: string;
  timestamp: number;
  [key: string]: any;
}

export interface BaseEntityRecord<EventType extends BaseEvent> {
  events: EventType[];
  [key: string]: any;
}

export const createEntityStore = <
  EntityEvents extends BaseEvent = BaseEvent,
  EntityRecord extends
    BaseEntityRecord<EntityEvents> = BaseEntityRecord<EntityEvents>,
>({
  datastore,
  defaultPrefix = "entities",
  parse = JSON.parse,
  stringify = JSON.stringify,
}: {
  datastore: Datastore;
  defaultPrefix?: string;
  parse?: (data: string) => EntityRecord;
  stringify?: (record: EntityRecord) => string;
}) => {
  const createKey = (entityId: string) =>
    new Key(`/${defaultPrefix}/${entityId}`);

  const has = async ({ entityId }: { entityId: string }): Promise<boolean> => {
    return datastore.has(createKey(entityId));
  };

  const get = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<EntityRecord> => {
    const data = await datastore.get(createKey(entityId));
    const result = parse(new TextDecoder().decode(data));
    return result;
  };

  const getSafe = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<EntityRecord | null> => {
    try {
      return await get({ entityId });
    } catch (e: unknown) {
      if (e instanceof Error) {
        if (e?.message?.includes("NotFound")) {
          return null;
        }
      }

      console.error(`Error getting entity ${entityId}:`, e);
      throw e;
    }
  };

  const put = async ({
    entityId,
    record,
  }: {
    entityId: string;
    record: EntityRecord;
  }): Promise<Key> => {
    const jsonString = stringify(record);
    const data = new TextEncoder().encode(jsonString);
    return datastore.put(createKey(entityId), data);
  };

  const del = async ({ entityId }: { entityId: string }): Promise<void> => {
    await datastore.delete(createKey(entityId));
  };

  const all = async ({
    filters = undefined,
    limit = undefined,
    offset = undefined,
    prefix = defaultPrefix,
  }: {
    prefix?: string;
    filters?: QueryFilter[];
    limit?: number;
    offset?: number;
  } = {}): Promise<EntityRecord[]> => {
    const entities: EntityRecord[] = [];
    for await (const entry of datastore.query({
      limit,
      filters,
      offset,
      prefix: `/${prefix}/`,
    })) {
      entities.push(parse(new TextDecoder().decode(entry.value)));
    }
    return entities;
  };

  const rollback = async ({
    entityId,
  }: {
    entityId: string;
  }): Promise<void> => {
    const record = await get({ entityId });

    if (record.events.length === 0) {
      throw new Error("No events to rollback");
    }

    record.events.pop();

    await put({ entityId, record });
  };

  const rollbackEvent = async ({
    entityId,
    eventType,
  }: {
    entityId: string;
    eventType: string;
  }): Promise<void> => {
    const record = await get({ entityId });

    const index = record.events.findIndex((e) => e.type === eventType);
    if (index === -1) {
      throw new Error("Event not found");
    }

    //only delete the last event if it is the last event in the list.
    if (index === record.events.length - 1) {
      record.events.splice(index, 1);
      await put({ entityId, record });
    }
  };

  const getMany = async ({
    keys,
  }: {
    keys: Key[];
  }): Promise<EntityRecord[]> => {
    try {
      const records = datastore.getMany(keys);

      const results: EntityRecord[] = [];

      for await (const entry of records) {
        if (entry.value) {
          results.push(parse(new TextDecoder().decode(entry.value)));
        }
      }

      return results;
    } catch (e) {
      if (e instanceof NotFoundError) {
        console.error(`Entity not found`);
      } else {
        console.error(`Error getting entity`, e);
      }
      throw e;
    }
  };

  return {
    has,
    get,
    put,
    delete: del,
    all,
    rollback,
    rollbackEvent,
    datastore,
    getSafe,
    getMany,
  };
};
