export const runConnectFlow = async <TResponse>({
  autoSyncBeforeConnect,
  skipSync,
  syncWithManager,
  requestToWork,
}: {
  autoSyncBeforeConnect: boolean;
  skipSync?: boolean;
  syncWithManager: () => Promise<unknown>;
  requestToWork: () => Promise<readonly [TResponse | null, Error | null]>;
}) => {
  if (autoSyncBeforeConnect && !skipSync) {
    await syncWithManager();
  }

  return await requestToWork();
};
