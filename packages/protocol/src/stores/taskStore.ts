import { type Datastore, Key } from "interface-datastore";
import { parseWithBigInt, stringifyWithBigInt } from "../core/utils.js";
import type { BaseTaskEvent, TaskRecord } from "../common/types.js";

export const createCoreTaskStore = <EventType extends BaseTaskEvent>({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const has = async ({ entityId }: { entityId: string }): Promise<boolean> => {
    return datastore.has(new Key(`/tasks/${entityId}`));
  };

  const get = async ({
    entityId,
  }: { entityId: string }): Promise<TaskRecord<EventType>> => {
    try {
      const data = await datastore.get(new Key(`/tasks/${entityId}`));
      return parseWithBigInt(data.toString());
    } catch (e) {
      console.error("Entity not found");
      throw e;
    }
  };

  const put = async ({
    entityId,
    record,
  }: {
    entityId: string;
    record: TaskRecord<EventType>;
  }): Promise<Key> => {
    return datastore.put(
      new Key(`/tasks/${entityId}`),
      Buffer.from(stringifyWithBigInt(record)),
    );
  };

  const del = async ({ entityId }: { entityId: string }): Promise<void> => {
    await datastore.delete(new Key(`/tasks/${entityId}`));
  };

  const all = async (): Promise<TaskRecord<EventType>[]> => {
    const tasks: TaskRecord<EventType>[] = [];
    for await (const entry of datastore.query({})) {
      tasks.push(JSON.parse(entry.value.toString()));
    }
    return tasks;
  };

  return {
    has,
    get,
    put,
    delete: del,
    all,
  };
};
