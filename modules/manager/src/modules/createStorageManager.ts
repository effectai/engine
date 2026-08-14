import { createHash } from "node:crypto";
import type { PeerId } from "@libp2p/interface";
import type { StorageObjectStore } from "../stores/storageObjectStore.js";

export const computeObjectHash = (data: Uint8Array): string => {
  return createHash("sha256").update(data).digest("hex");
};

export const createStorageManager = ({
  storageStore,
}: {
  storageStore: StorageObjectStore;
}) => {

  const handleStoreObject = async (
    payload: { data: Uint8Array },
    { peerId }: { peerId: PeerId },
  ) => {
    const owner = peerId.toString();
    const hash = computeObjectHash(payload.data);

    const existing = await storageStore.getMeta(hash);
    if (existing) {
      return {
        storeObjectResponse: {
          hash,
        },
      };
    }

    await storageStore.put({ hash, data: payload.data, owner });

    return {
      storeObjectResponse: {
        hash,
      },
    };
  };

  const handleGetObject = async (
    payload: { hash: string },
  ) => {
    const meta = await storageStore.getMeta(payload.hash);
    if (!meta) {
      throw new Error("Object not found");
    }

    const data = await storageStore.get(payload.hash);

    return {
      getObjectResponse: {
        data: data || new Uint8Array(0),
        owner: meta.owner,
      },
    };
  };

  const handleDeleteObject = async (
    payload: { hash: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const requester = peerId.toString();
    const meta = await storageStore.getMeta(payload.hash);

    if (!meta) {
      throw new Error("Object not found");
    }

    if (meta.owner !== requester) {
      throw new Error("Only the owner can delete an object");
    }

    await storageStore.delete(payload.hash);
  };

  return {
    handleStoreObject,
    handleGetObject,
    handleDeleteObject,
  };
};

export type StorageManager = ReturnType<typeof createStorageManager>;