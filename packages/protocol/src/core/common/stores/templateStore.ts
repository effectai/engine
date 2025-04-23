import type { Datastore } from "interface-datastore";
import type { Template } from "../../messages/effect.js";
import { createEntityStore } from "../../store.js";
import { stringifyWithBigInt, parseWithBigInt } from "../../utils.js";

export interface TemplateEvent {
  type: string;
  timestamp: number;
}

export interface TemplateCreatedEvent extends TemplateEvent {
  type: "create";
  createdByPeer: string;
}

export type TemplateEvents = TemplateCreatedEvent;

export interface TemplateRecord {
  events: TemplateEvents[];
  state: Template;
}

export const createTemplateStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<TemplateEvents, TemplateRecord>({
    datastore,
    defaultPrefix: "templates",
    stringify: (record) => JSON.stringify(record),
    parse: (data) => JSON.parse(data),
  });

  const create = async ({
    template,
    createdByPeer,
  }: {
    template: Template;
    createdByPeer: string;
  }): Promise<TemplateRecord> => {
    const record: TemplateRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
          createdByPeer,
        },
      ],
      state: template,
    };

    await coreStore.put({ entityId: template.templateId, record });

    return record;
  };

  return {
    ...coreStore,
    create,
  };
};

export type TemplateStore = ReturnType<typeof createTemplateStore>;
