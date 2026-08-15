import {
  type Multiaddr,
  type PaymentRecord,
  peerIdFromString,
} from "@effectai/protocol-core";
import type { Payment } from "@effectai/protobufs";

const MAX_BATCH_SIZE = 100;
const NODE_FETCH_LIMIT = 3;

interface StoredPayment {
  id: string;
  version: number;
  recipient: string;
  paymentAccount: string;
  publicKey: string;
  label?: string;
  nonce: string;
  amount: string;
  signature?: Payment["signature"];
}

const toStoredPayment = (p: Payment): StoredPayment => ({
  id: p.id,
  version: p.version,
  recipient: p.recipient,
  paymentAccount: p.paymentAccount,
  publicKey: p.publicKey,
  label: p.label,
  nonce: p.nonce.toString(),
  amount: p.amount.toString(),
  signature: p.signature,
});

const toPayment = (s: StoredPayment): Payment => ({
  id: s.id,
  version: s.version,
  recipient: s.recipient,
  paymentAccount: s.paymentAccount,
  publicKey: s.publicKey,
  label: s.label,
  nonce: BigInt(s.nonce),
  amount: BigInt(s.amount),
  signature: s.signature,
});

const maxNonce = (payments: StoredPayment[]): bigint =>
  payments.reduce(
    (max, p) => {
      const nonce = BigInt(p.nonce);
      return nonce > max ? nonce : max;
    },
    0n,
  );

/**
 * Backup payments from local IndexedDB to the manager's storage layer.
 *
 * The pointer `worker-payments-<deviceId>-<managerPeerId>` points to
 * the head of a linked list of objects. Each object holds a batch of
 * payment encoded as JSON with the newest batch first.
 *
 * Local and remote nonces are compared to the on-chain payment nonce:
 * - remote is newer than local                        -> download payments
 * - local has unclaimed payments the remote doesn't   -> upload
 * - remote chain is fully claimed                     -> wipe & re-upload
 *
 * Failures are logged but not thrown, this is a best effort basis to
 * backup payments.
 */
export function usePaymentSync() {
  const syncPayments = async (
    managerMultiaddr: Multiaddr,
    nonces: { remoteNonce: bigint | null; localNonce: bigint },
  ): Promise<void> => {
    try {
      await runSync(managerMultiaddr, nonces);
    } catch (error) {
      console.error("[PaymentSync] Sync failed:", error);
    }
  };

  return { syncPayments };
}

const runSync = async (
  managerMultiaddr: Multiaddr,
  nonces: { remoteNonce: bigint | null; localNonce: bigint },
): Promise<void> => {
  const workerStore = useWorkerStore();
  const entity = workerStore.instance?.entity;
  const managerPeerId = managerMultiaddr.getPeerId();
  const managerPublicKey =
    useSessionStore().manager?.publicKey?.toString() ?? null;
  const recipient = useAuth().account.value;

  if (!entity || !managerPeerId || !managerPublicKey || !recipient) {
    console.warn("[PaymentSync] Missing context, skipping sync");
    return;
  }

  // Derive device identity from the seed modifier (same as device registration)
  const modifier = localStorage.getItem("modifier");
  if (!modifier) {
    console.warn("[PaymentSync] No seed modifier found, skipping sync");
    return;
  }
  const modifierHex = Buffer.from(modifier, "hex").slice(0, 4).toString("hex");

  // Use the nonces already fetched by the caller (from useGetNoncesAsyncQuery)
  const onChainNonce = nonces.remoteNonce != null ? BigInt(nonces.remoteNonce) : 0n;
  const localMax = BigInt(nonces.localNonce ?? 0);

  // Fetch remote payment nonce from manager storage
  const pointerKey = `worker-payments-${modifierHex}-${managerPeerId}`;
  const [ptrRes] = await entity.sendMessage(managerMultiaddr, {
    getPointer: { key: pointerKey },
  });
  const ptr = ptrRes as any;
  const remoteHead = ptr?.found && ptr.value ? (ptr.value as string) : null;

  let remoteMax = 0n;
  if (remoteHead) {
    const [headRes] = await entity.sendMessage(managerMultiaddr, {
      getObject: { hash: remoteHead, limit: 1 },
    });
    const headItem = (headRes as { items?: Array<{ data: Uint8Array }> } | null)
      ?.items?.[0];
    if (!headItem) {
      console.warn("[PaymentSync] worker-payments pointer is dangling");
      return;
    }
    const headBatch = JSON.parse(
      new TextDecoder().decode(headItem.data),
    ) as StoredPayment[];
    remoteMax = maxNonce(headBatch);
  }

  // If remote nonce is higher: download payments
  const downloadCutoff = localMax > onChainNonce ? localMax : onChainNonce;
  if (remoteMax > downloadCutoff && remoteHead) {
    console.log(
      `[PaymentSync] Downloading payments above nonce ${downloadCutoff.toString()}`,
    );
    await downloadRemoteChain({
      entity,
      managerMultiaddr,
      headHash: remoteHead,
      cutoff: downloadCutoff,
      managerPeerId,
      managerPublicKey,
      recipient,
    });
    return;
  }

  // If local nonce is higher: upload payments
  const uploadCutoff = remoteMax > onChainNonce ? remoteMax : onChainNonce;
  const unclaimed = (await workerStore.instance?.getPaymentsFromNonce({
    nonce: Number(uploadCutoff) + 1,
    peerId: managerPeerId,
    publicKey: managerPublicKey,
    recipient,
  })) ?? [];
  if (unclaimed.length === 0) {
    console.log("[PaymentSync] Remote chain is up to date, nothing to upload");
    return;
  }

  // If all remote payments are already claimed delete the remote payment chain
  const wipeRemote = remoteMax > 0n && remoteMax <= onChainNonce;

  const sorted = [...unclaimed].sort(
    (a, b) => Number(a.state.nonce) - Number(b.state.nonce),
  );
  const batches: PaymentRecord[][] = [];
  for (let i = 0; i < sorted.length; i += MAX_BATCH_SIZE) {
    batches.push(sorted.slice(i, i + MAX_BATCH_SIZE));
  }

  // Store payment chain remotely as linked list
  let prevHash = wipeRemote ? null : remoteHead;
  const storedHashes: string[] = [];
  try {
    for (const batch of batches) {
      const bytes = new TextEncoder().encode(
        JSON.stringify(batch.map((r) => toStoredPayment(r.state))),
      );
      const [storeRes, storeErr] = await entity.sendMessage(managerMultiaddr, {
        storeObject: {
          data: bytes,
          type: prevHash ? 1 : 0,
          next: prevHash ?? "",
        },
      });
      if (storeErr) {
        throw new Error(`Failed to store payment batch: ${storeErr}`);
      }
      const hash = (storeRes as any)?.hash;
      if (!hash) {
        throw new Error("Failed to store payment batch: no hash returned");
      }
      prevHash = hash;
      storedHashes.push(hash);
    }
  } catch (error) {
    // Roll back the partially uploaded chain so no orphans accumulate
    for (const hash of storedHashes) {
      await entity.sendMessage(managerMultiaddr, { deleteObject: { hash } });
    }
    throw error;
  }

  const newHead = prevHash!;
  const [setRes, setErr] = await entity.sendMessage(managerMultiaddr, {
    setPointer: {
      key: pointerKey,
      value: newHead,
      ...(remoteHead ? { expected: remoteHead } : {}),
    },
  });
  if (setErr || !(setRes as { updated?: boolean } | null)?.updated) {
    for (const hash of storedHashes) {
      await entity.sendMessage(managerMultiaddr, { deleteObject: { hash } });
    }
    throw new Error(
      "Failed to update worker-payments pointer (concurrent update?)",
    );
  }

  // Clean up the old remote chain if it was fully claimed
  if (wipeRemote && remoteHead) {
    const [, delErr] = await entity.sendMessage(managerMultiaddr, {
      deleteObject: { hash: remoteHead },
    });
    if (delErr) {
      console.error(
        "[PaymentSync] Failed to delete claimed chain:",
        delErr.message,
      );
    }
  }

  console.log(
    `[PaymentSync] Uploaded ${unclaimed.length} payments (${batches.length} batches)`,
  );
};

const downloadRemoteChain = async ({
  entity,
  managerMultiaddr,
  headHash,
  cutoff,
  managerPeerId,
  managerPublicKey,
  recipient,
}: {
  entity: any;
  managerMultiaddr: Multiaddr;
  headHash: string;
  cutoff: bigint;
  managerPeerId: string;
  managerPublicKey: string;
  recipient: string;
}): Promise<void> => {
  const workerStore = useWorkerStore();
  let cursor: string | null = headHash;
  let downloaded = 0;

  while (cursor) {
    const [res] = await (entity.sendMessage(managerMultiaddr, {
      getObject: { hash: cursor, limit: NODE_FETCH_LIMIT },
    }) as Promise<[any, any]>);
    const items: any[] = (res as any)?.items ?? [];
    if (items.length === 0) break;

    for (const item of items) {
      const batch = JSON.parse(new TextDecoder().decode(item.data)) as
        StoredPayment[];
      // Batches are newest-first, so once one is below the cutoff the rest are too
      if (maxNonce(batch) <= cutoff) return;
      for (const stored of batch) {
        const payment = toPayment(stored);
        if (payment.nonce > cutoff) {
          await workerStore.instance?.createPayment({
            payment,
            managerPeerId: peerIdFromString(managerPeerId),
          });
          downloaded++;
        }
      }
    }

    const last: any = items[items.length - 1];
    if (!last) break;
    cursor = last.next || null;
  }

  console.log(`[PaymentSync] Downloaded ${downloaded} payments`);
};
