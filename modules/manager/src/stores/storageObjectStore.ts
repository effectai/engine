import { type Datastore, Key } from "@effectai/protocol-core";

export interface ObjectMetadata {
  owner: string;
  timestamp: number;
}

export const createStorageObjectStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const dataPrefix = "storage-data";
  const metaPrefix = "storage-meta";

  const dataKey = (hash: string) => new Key(`/${dataPrefix}/${hash}`);
  const metaKey = (hash: string) => new Key(`/${metaPrefix}/${hash}`);

  const has = async (hash: string): Promise<boolean> => {
    return datastore.has(metaKey(hash));
  };

  const getMeta = async (hash: string): Promise<ObjectMetadata | null> => {
    try {
      const raw = await datastore.get(metaKey(hash));
      return JSON.parse(new TextDecoder().decode(raw)) as ObjectMetadata;
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes("NotFound")) {
        return null;
      }
      throw e;
    }
  };

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

  const put = async ({
    hash,
    data,
    owner,
  }: {
    hash: string;
    data: Uint8Array;
    owner: string;
  }): Promise<void> => {
    const metadata: ObjectMetadata = {
      owner,
      timestamp: Math.floor(Date.now() / 1000),
    };
    await datastore.put(metaKey(hash), new TextEncoder().encode(JSON.stringify(metadata)));
    await datastore.put(dataKey(hash), data);
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
    delete: del,
  };
};

export type StorageObjectStore = ReturnType<typeof createStorageObjectStore>;