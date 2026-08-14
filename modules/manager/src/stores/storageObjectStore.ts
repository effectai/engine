import { type Datastore, Key } from "@effectai/protocol-core";

export interface ObjectMeta {
  type: number;
  owner: string;  // hex-encoded raw public key bytes (64 hex chars)
  next: string;   // next hash, or "" for end of chain
}

export interface Quota {
  objectCount: number;
  totalBytes: number;  // sum of raw user data byte lengths
}

export const createStorageObjectStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const DATA_PREFIX = "storage-data";
  const META_PREFIX = "storage-meta";
  const QUOTA_PREFIX = "storage-quota";

  const dataKey = (hash: string) => new Key(`/${DATA_PREFIX}/${hash}`);
  const metaKey = (hash: string) => new Key(`/${META_PREFIX}/${hash}`);
  const quotaKey = (owner: string) => new Key(`/${QUOTA_PREFIX}/${owner}`);

  const has = async (hash: string): Promise<boolean> => {
    return datastore.has(metaKey(hash));
  };

  /** Returns the raw user data bytes, or null. */
  const get = async (hash: string): Promise<Uint8Array | null> => {
    try {
      return await datastore.get(dataKey(hash));
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes("NotFound")) {
        return null;
      }
      throw e;
    }
  };

  const getMeta = async (hash: string): Promise<ObjectMeta | null> => {
    try {
      const raw = await datastore.get(metaKey(hash));
      if (raw == null) return null;
      return JSON.parse(new TextDecoder().decode(raw)) as ObjectMeta;
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes("NotFound")) {
        return null;
      }
      throw e;
    }
  };

  const put = async (hash: string, data: Uint8Array): Promise<void> => {
    await datastore.put(dataKey(hash), data);
  };

  const putMeta = async (hash: string, meta: ObjectMeta): Promise<void> => {
    await datastore.put(
      metaKey(hash),
      new TextEncoder().encode(JSON.stringify(meta)),
    );
  };

  const del = async (hash: string): Promise<void> => {
    await datastore.delete(metaKey(hash));
    await datastore.delete(dataKey(hash));
  };

  // --- Quota tracking ---

  const getQuota = async (owner: string): Promise<Quota> => {
    try {
      const raw = await datastore.get(quotaKey(owner));
      return JSON.parse(new TextDecoder().decode(raw)) as Quota;
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes("NotFound")) {
        return { objectCount: 0, totalBytes: 0 };
      }
      throw e;
    }
  };

  const writeQuota = async (owner: string, quota: Quota): Promise<void> => {
    await datastore.put(
      quotaKey(owner),
      new TextEncoder().encode(JSON.stringify(quota)),
    );
  };

  const incrementQuota = async (
    owner: string,
    byteCount: number,
  ): Promise<void> => {
    const quota = await getQuota(owner);
    quota.objectCount += 1;
    quota.totalBytes += byteCount;
    await writeQuota(owner, quota);
  };

  const decrementQuota = async (
    owner: string,
    byteCount: number,
  ): Promise<void> => {
    const quota = await getQuota(owner);
    quota.objectCount = Math.max(0, quota.objectCount - 1);
    quota.totalBytes = Math.max(0, quota.totalBytes - byteCount);
    await writeQuota(owner, quota);
  };

  const listQuotas = async (): Promise<Quota[]> => {
    const quotas: Quota[] = [];
    for await (const key of datastore.queryKeys({ prefix: `/${QUOTA_PREFIX}/` })) {
      const raw = await datastore.get(key);
      if (raw != null) {
        quotas.push(JSON.parse(new TextDecoder().decode(raw)) as Quota);
      }
    }
    return quotas;
  };

  return {
    has,
    get,
    getMeta,
    put,
    putMeta,
    delete: del,
    getQuota,
    incrementQuota,
    decrementQuota,
    listQuotas,
  };
};

export type StorageObjectStore = ReturnType<typeof createStorageObjectStore>;