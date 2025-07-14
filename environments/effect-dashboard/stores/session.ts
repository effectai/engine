import { multiaddr, type Multiaddr } from "@effectai/protocol";
import { PublicKey } from "@solana/web3.js";

interface Session {
  account: PublicKey;
  connectedAt: Date;
  manager: {
    peerId: string;
    publicKey: PublicKey;
    multiaddr: Multiaddr;
  };
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

  // Derived state
  const isActive = computed(() => status.value === "active");
  const manager = computed(() => current.value?.manager ?? null);

  const establish = async (
    multiaddr: string,
    { recipient, currentNonce, accessCode },
  ) => {
    const worker = useWorkerStore();

    try {
      status.value = "connecting";
      error.value = null;

      const result = await worker.connect({
        target: params.target,
        identity: params.identity.toString(),
        auth: params.auth,
      });

      if (!result) throw new Error("Connection handshake failed");

      current.value = {
        account: params.identity,
        connectedAt: new Date(),
        manager: {
          peerId: result.peerId,
          publicKey: result.publicKey,
          multiaddr: params.target,
        },
        metadata: {
          accessCode: params.auth?.code,
          nonce: params.currentNonce,
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
      await useWorkerStore().disconnect();
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
  };
});
