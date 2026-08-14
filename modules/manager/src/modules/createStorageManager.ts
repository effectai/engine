import { createHash } from "node:crypto";
import type { PeerId } from "@libp2p/interface";
import type { StorageObjectStore } from "../stores/storageObjectStore.js";
import type { StoragePointerStore } from "../stores/storagePointerStore.js";

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
  storagePointerStore,
}: {
  storageStore: StorageObjectStore;
  storagePointerStore: StoragePointerStore;
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
    await storageStore.incrementQuota(bytesToHex(ownerBytes), payload.data.length);

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

  /** Delete a storage object and all it's linked items recursively */
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

      // Get data length for quota tracking before deleting
      const data = await storageStore.get(currentHash);
      const dataLen = data?.length ?? 0;

      await storageStore.delete(currentHash);
      await storageStore.decrementQuota(requesterHex, dataLen);
      currentHash = nextHash;
    }
  };

  const getQuota = async (owner: string) => {
    return storageStore.getQuota(owner);
  };

  const listQuotas = async () => {
    return storageStore.listQuotas();
  };

  // --- Pointer handlers ---

  const handleSetPointer = async (
    payload: { key: string; value: string; expected?: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const ownerHex = bytesToHex(getOwnerBytes(peerId));

    // Validate value is a 64-char hex string (32 bytes)
    if (!/^[0-9a-f]{64}$/i.test(payload.value)) {
      throw new Error("Pointer value must be a 64-character hex string (32 bytes)");
    }

    if (payload.expected !== undefined) {
      if (!/^[0-9a-f]{64}$/i.test(payload.expected)) {
        throw new Error("Pointer expected value must be a 64-character hex string (32 bytes)");
      }
      const { updated } = await storagePointerStore.compareAndSetPointer(
        ownerHex,
        payload.key,
        payload.expected,
        payload.value,
      );
      return { setPointerResponse: { updated } };
    }

    await storagePointerStore.setPointer(ownerHex, payload.key, payload.value);
    return { setPointerResponse: { updated: true } };
  };

  const handleGetPointer = async (
    payload: { key: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const ownerHex = bytesToHex(getOwnerBytes(peerId));
    const ptr = await storagePointerStore.getPointer(ownerHex, payload.key);
    if (!ptr) {
      return { getPointerResponse: { found: false, key: payload.key, value: "" } };
    }
    return { getPointerResponse: { found: true, key: ptr.key, value: ptr.value } };
  };

  const handleDeletePointer = async (
    payload: { key: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const ownerHex = bytesToHex(getOwnerBytes(peerId));
    const deleted = await storagePointerStore.deletePointer(ownerHex, payload.key);
    if (!deleted) {
      throw new Error("Pointer not found");
    }
  };

  const handleListPointers = async (
    payload: { owner?: string },
    { peerId }: { peerId: PeerId },
  ) => {
    const ownerHex = payload.owner || bytesToHex(getOwnerBytes(peerId));
    const pointers = await storagePointerStore.listPointers(ownerHex);
    return { listPointersResponse: { pointers } };
  };

  return {
    handleStoreObject,
    handleGetObject,
    handleDeleteObject,
    getQuota,
    listQuotas,
    handleSetPointer,
    handleGetPointer,
    handleDeletePointer,
    handleListPointers,
  };
};

export type StorageManager = ReturnType<typeof createStorageManager>;
