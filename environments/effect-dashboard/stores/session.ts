import {
  multiaddr,
  peerIdFromString,
  type Multiaddr,
  type PeerId,
} from "@effectai/protocol";
import { PublicKey } from "@solana/web3.js";

export interface Manager {
  peerId: PeerId;
  publicKey: PublicKey;
  multiaddr: Multiaddr;
}

interface Session {
  account: PublicKey;
  connectedAt: Date;
  manager: Manager;
  metadata?: {
    accessCode?: string;
    nonce?: bigint;
  };
}

export const useSessionStore = defineStore("session", () => {
  // State
  const current = shallowRef<Session | null>(null);
  const status = ref<"idle" | "connecting" | "active" | "error">("idle");
  const error = shallowRef<Error | null>(null);

  const now = useNow({ interval: 1000 });

  // Derived state
  const isActive = computed(() => status.value === "active");
  const manager = computed(() => current.value?.manager ?? null);

  // Computed uptime (in seconds)
  const uptimeSeconds = computed(() => {
    if (!isActive.value) return 0;
    return Math.floor(
      (now.value.getTime() - current.value?.connectedAt.getTime()) / 1000,
    );
  });

  const establish = async (
    multiAddress: string,
    {
      recipient,
      currentNonce,
      accessCode,
    }: {
      recipient: string;
      currentNonce: bigint;
      accessCode?: string;
    },
  ) => {
    const worker = useWorkerStore();

    try {
      status.value = "connecting";
      error.value = null;

      const result = await worker.instance?.connect(multiaddr(multiAddress), {
        recipient,
        nonce: currentNonce,
        accessCode,
      });

      if (!result) throw new Error("Connection handshake failed");

      current.value = {
        account: new PublicKey(recipient),
        connectedAt: new Date(),
        manager: {
          peerId: peerIdFromString(result.peer),
          publicKey: new PublicKey(result.pubkey),
          multiaddr: multiaddr(multiAddress),
        },
        metadata: {
          accessCode,
          nonce: currentNonce,
        },
      };

      status.value = "active";
      return result;
    } catch (err) {
      status.value = "error";
      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    }
  };

  const terminate = async () => {
    if (!current.value) return;

    try {
      //TODO:: Implement the actual disconnection logic
    } finally {
      current.value = null;
      status.value = "idle";
    }
  };

  return {
    current: readonly(current),
    status: readonly(status),
    error: readonly(error),
    isActive,
    manager,
    establish,
    terminate,
    uptimeSeconds,
  };
});
