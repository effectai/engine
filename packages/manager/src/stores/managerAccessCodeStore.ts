import { createEntityStore, type Datastore } from "@effectai/protocol-core";

export type AccessCode = {
  code: string;
};

export interface AccessCodeEvent {
  type: string;
  timestamp: number;
}

export interface AccessCodeCreated extends AccessCodeEvent {
  type: "create";
}

export interface AccessCodeRedeemed extends AccessCodeEvent {
  type: "redeem";
  redeemedBy: string;
}

export type AccessCodeEvents = AccessCodeCreated | AccessCodeRedeemed;

export interface AccessCodeRecord {
  events: AccessCodeEvents[];
  state: AccessCode;
}

export const createAccessCodeStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const coreStore = createEntityStore<AccessCodeEvents, AccessCodeRecord>({
    datastore,
    defaultPrefix: "access-code",
    stringify: (record) => JSON.stringify(record),
    parse: (data) => JSON.parse(data),
  });

  const isRedeemed = (events: AccessCodeEvents[]) => {
    return events.some((event) => event.type === "redeem");
  };

  const create = async (): Promise<string> => {
    const accessCode = Math.random().toString(36).substring(2, 10);

    const record: AccessCodeRecord = {
      events: [
        {
          timestamp: Math.floor(Date.now() / 1000),
          type: "create",
        },
      ],
      state: {
        code: accessCode,
      },
    };

    await coreStore.put({ entityId: accessCode, record });

    return accessCode;
  };

  const redeem = async (code: string, peerIdStr: string) => {
    const record = await coreStore.get({ entityId: code });

    if (isRedeemed(record.events)) {
      throw new Error("Access code has already been redeemed");
    }

    record.events.push({
      type: "redeem",
      redeemedBy: peerIdStr,
      timestamp: Math.floor(new Date().getTime() / 1000),
    });

    await coreStore.put({ entityId: code, record });
  };

  return {
    ...coreStore,
    create,
    redeem,
  };
};
