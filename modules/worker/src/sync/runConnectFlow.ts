import type { EffectProtocolMessage } from "@effectai/protobufs";

export const runConnectFlow = async ({
  autoSyncBeforeConnect,
  skipSync,
  syncWithManager,
  requestToWork,
}: {
  autoSyncBeforeConnect: boolean;
  skipSync?: boolean;
  syncWithManager: () => Promise<unknown>;
  requestToWork: () => Promise<
    readonly [EffectProtocolMessage | null, Error | null]
  >;
}) => {
  if (autoSyncBeforeConnect && !skipSync) {
    await syncWithManager();
  }

  return await requestToWork();
};
