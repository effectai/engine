import {
  type Multiaddr,
  multiaddr,
  type PeerId,
  peerIdFromString,
} from "@effectai/protocol-core";

import { type Address, address } from "@solana/kit";

export interface Manager {
  peerId: PeerId;
  publicKey: Address;
  multiaddr: Multiaddr;
}

interface Session {
  account: Address;
  connectedAt: Date;
  manager: Manager;
  metadata?: {
    accessCode?: string;
    nonce?: bigint;
  };
}

import { useNow } from "@vueuse/core";
export const useSessionStore = defineStore("session", () => {
  const toast = useToast();
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
    const { userCapabilityAssignmentIds } = useCapabilities();

    try {
      status.value = "connecting";
      error.value = null;
      assertExists(worker.instance, "Worker instance is not available");

      //start the node if not already started
      if (worker.instance.entity.node.status !== "started") {
        await worker.instance.start();
      }

      const result = await worker.instance?.connect(multiaddr(multiAddress), {
        recipient,
        nonce: currentNonce,
        accessCode,
        capabilities: userCapabilityAssignmentIds.value,
      });

      if (!result) throw new Error("Connection handshake failed");

      current.value = {
        account: address(recipient),
        connectedAt: new Date(),
        manager: {
          peerId: peerIdFromString(result.peer),
          publicKey: address(result.pubkey),
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

      toast.add({
        color: "error",
        title: "Connection Error",
        description: err instanceof Error ? err.message : String(err),
      });

      error.value = err instanceof Error ? err : new Error(String(err));
      throw error.value;
    }
  };

  const terminate = async () => {
    console.log("Terminating session...", current.value);
    if (!current.value) return;

    try {
      const worker = useWorkerStore();
      assertExists(worker.instance, "Worker instance is not available");
      await worker.instance.stop();
      console.log("Worker instance stopped");
      status.value = "idle";
      error.value = null;
      current.value = null;
      status.value = "idle";
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
