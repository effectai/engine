import { Datastore, Key } from "interface-datastore";

// base-types.ts
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
  prefix = "/entities/",
  parse = JSON.parse,
  stringify = JSON.stringify,
}: {
  datastore: Datastore;
  prefix?: string;
  parse?: (data: string) => EntityRecord;
  stringify?: (record: EntityRecord) => string;
}) => {
  const createKey = (entityId: string) => new Key(`/${prefix}/${entityId}`);

  const has = async ({ entityId }: { entityId: string }): Promise<boolean> => {
    return datastore.has(createKey(entityId));
  };

  const get = async ({
    entityId,
  }: { entityId: string }): Promise<EntityRecord> => {
    const data = await datastore.get(createKey(entityId));
    return parse(data.toString());
  };

  const put = async ({
    entityId,
    record,
  }: {
    entityId: string;
    record: EntityRecord;
  }): Promise<Key> => {
    return datastore.put(createKey(entityId), Buffer.from(stringify(record)));
  };

  const del = async ({ entityId }: { entityId: string }): Promise<void> => {
    await datastore.delete(createKey(entityId));
  };

  const all = async (): Promise<EntityRecord[]> => {
    const entities: EntityRecord[] = [];
    for await (const entry of datastore.query({
      prefix: `/${prefix}/`,
    })) {
      entities.push(parse(entry.value.toString()));
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

    record.events.splice(index, 1);

    await record.put({ entityId, record });
  };

  return {
    has,
    get,
    put,
    delete: del,
    all,
    rollback,
    rollbackEvent,
  };
};
