import { createHash } from "node:crypto";
import type { PeerId } from "@libp2p/interface";
import type { StorageObjectStore } from "../stores/storageObjectStore.js";

const OBJECT_TYPE_RAW = 0;
const OBJECT_TYPE_LINKED_LIST = 1;
const OWNER_LENGTH = 32;
const HASH_LENGTH = 32;
const DEFAULT_LIMIT = 10;

/** Convert hex string to Uint8Array */
const hexToBytes = (h: string): Uint8Array => {
  const bytes = new Uint8Array(h.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

/** Convert Uint8Array ot hex string */
const bytesToHex = (bytes: Uint8Array): string => {
  let h = "";
  for (let i = 0; i < bytes.length; i++) {
    h += bytes[i].toString(16).padStart(2, "0");
  }
  return h;
};

/** Get deterministic 32-byte owner identifier from a PeerId. */
const getOwnerBytes = (peerId: PeerId): Uint8Array => {
  return createHash("sha256").update(peerId.toString()).digest();
};

/**
 * Binary-encode the a storage entry.
 *
 * Each encoding embeds the type and the owner. Depending on the type
 * more fields can be encoded. The following 2 types are currently
 * supported in the protocol:
 *
 * Type 0x00 (raw): [type(1), owner(32), data(var)]
 * Type 0x01 (list): [type(1), owner(32), next(32), data(var)]
 *
 * Linked lists are added for convenience of retrieval and deletion.
 */
const encodeBlob = (
  type: number,
  owner: Uint8Array,
  data: Uint8Array,
  next?: string,
): Uint8Array => {
  if (type === OBJECT_TYPE_LINKED_LIST) {
    const nextBytes = hexToBytes(next!);
    const buf = new Uint8Array(1 + OWNER_LENGTH + HASH_LENGTH + data.length);
    buf[0] = type;
    buf.set(owner, 1);
    buf.set(nextBytes, 1 + OWNER_LENGTH);
    buf.set(data, 1 + OWNER_LENGTH + HASH_LENGTH);
    return buf;
  }

  const buf = new Uint8Array(1 + OWNER_LENGTH + data.length);
  buf[0] = type;
  buf.set(owner, 1);
  buf.set(data, 1 + OWNER_LENGTH);
  return buf;
};

/**
 * Get the addressable content Hash for an Object.
 *
 * `data` is the encoded piece from `encodeBlob`.
 */
export const computeObjectHash = (data: Uint8Array): string => {
  return createHash("sha256").update(data).digest("hex");
};

export const createStorageManager = ({
  storageStore,
}: {
  storageStore: StorageObjectStore;
}) => {
  const handleStoreObject = async (
    payload: { data: Uint8Array; type?: number; next?: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const ownerBytes = getOwnerBytes(peerId);
    const next = payload.next || undefined;

    // If next is provided it's a linked-list node; otherwise it's raw.
    // The caller's type field is ignored — next determines the type.
    const effectiveType = next ? OBJECT_TYPE_LINKED_LIST : OBJECT_TYPE_RAW;

    const blob = encodeBlob(effectiveType, ownerBytes, payload.data, next);
    const hash = computeObjectHash(blob);

    const existing = await storageStore.getMeta(hash);
    if (existing) {
      return { storeObjectResponse: { hash } };
    }

    await storageStore.put(hash, payload.data);
    await storageStore.putMeta(hash, {
      type: effectiveType,
      owner: bytesToHex(ownerBytes),
      next: next ?? "",
    });

    return { storeObjectResponse: { hash } };
  };

  const handleGetObject = async (
    payload: { hash: string; limit?: number },
  ) => {
    const limit = payload.limit ?? DEFAULT_LIMIT;
    const items: Array<{
      hash: string;
      type: number;
      owner: Uint8Array;
      next: string;
      data: Uint8Array;
    }> = [];
    let currentHash: string | null = payload.hash;

    while (currentHash && items.length < limit) {
      const meta = await storageStore.getMeta(currentHash);
      if (!meta) throw new Error("Object not found");

      const data = await storageStore.get(currentHash);
      if (!data) throw new Error("Object not found");

      items.push({
        hash: currentHash,
        type: meta.type,
        owner: hexToBytes(meta.owner),
        next: meta.next,
        data,
      });

      currentHash =
        meta.type === OBJECT_TYPE_LINKED_LIST && meta.next
          ? meta.next
          : null;
    }

    return { getObjectResponse: { items } };
  };

  const handleDeleteObject = async (
    payload: { hash: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const requesterHex = bytesToHex(getOwnerBytes(peerId));
    let currentHash: string | null = payload.hash;

    while (currentHash) {
      const meta = await storageStore.getMeta(currentHash);
      if (!meta) throw new Error("Object not found");

      if (meta.owner !== requesterHex) {
        throw new Error("Only the owner can delete an object");
      }

      const nextHash =
        meta.type === OBJECT_TYPE_LINKED_LIST && meta.next
          ? meta.next
          : null;
      await storageStore.delete(currentHash);
      currentHash = nextHash;
    }
  };

  return {
    handleStoreObject,
    handleGetObject,
    handleDeleteObject,
  };
};

export type StorageManager = ReturnType<typeof createStorageManager>;
