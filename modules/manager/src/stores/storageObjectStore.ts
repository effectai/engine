import { type Datastore, Key } from "@effectai/protocol-core";

export interface ObjectMeta {
  type: number;
  owner: string;  // hex-encoded raw public key bytes (64 hex chars)
  next: string;   // next hash, or "" for end of chain
}

export const createStorageObjectStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const DATA_PREFIX = "storage-data";
  const META_PREFIX = "storage-meta";

  const dataKey = (hash: string) => new Key(`/${DATA_PREFIX}/${hash}`);
  const metaKey = (hash: string) => new Key(`/${META_PREFIX}/${hash}`);

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

  return {
    has,
    get,
    getMeta,
    put,
    putMeta,
    delete: del,
  };
};

export type StorageObjectStore = ReturnType<typeof createStorageObjectStore>;