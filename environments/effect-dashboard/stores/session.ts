import { multiaddr, type Multiaddr } from "@effectai/protocol";
import { PublicKey } from "@solana/web3.js";

type SessionPayload = {
  account: string;
  connectedOn: number;
  managerMultiAddress: string;
  managerPublicKey: string;
  managerPeerId: string;
  accessCode?: string;
};

export const useSessionStore = defineStore("session", () => {
  const account: Ref<PublicKey | null> = ref(null);
  const connectedOn: Ref<number | null> = ref(null);
  const managerPeerId: Ref<string | null> = ref(null);
  const managerPublicKey: Ref<PublicKey | null> = ref(null);
  const managerMultiAddress: Ref<string | null> = ref(null);
  const accessCode = ref<string | undefined>(undefined);

  const setSession = (payload: SessionPayload) => {
    account.value = new PublicKey(payload.account);
    connectedOn.value = payload.connectedOn;
    managerPeerId.value = payload.managerPeerId;
    managerPublicKey.value = new PublicKey(payload.managerPublicKey);
    managerMultiAddress.value = payload.managerMultiAddress;
    accessCode.value = payload.accessCode;
  };

  const useActiveSession = () => {
    if (
      !connectedOn.value ||
      !account.value ||
      !managerPeerId.value ||
      !managerPublicKey.value
    ) {
      throw new Error("No active session");
    }

    return {
      account,
      managerPublicKey,
      connectedOn,
      managerMultiAddress,
      managerPeerId,
      accessCode,
      useGetNonce: () => {
        return useNextNonce(
          ref(managerPublicKey.value?.toString()),
          ref(managerPeerId.value?.toString()),
        );
      },
    };
  };

  const connect = async ({
    managerMultiAddress,
    account,
    currentNonce,
    accessCode,
  }: {
    managerMultiAddress: Multiaddr;
    account: string;
    currentNonce: bigint;
    accessCode?: string;
  }) => {
    const workerStore = useWorkerStore();
    const { worker } = storeToRefs(workerStore);

    if (!worker.value) {
      throw new Error("Worker not initialized");
    }

    const managerPeerId = managerMultiAddress.getPeerId();

    if (!managerPeerId) {
      throw new Error("Manager multiaddress is not valid");
    }

    const result = await worker.value.connect(
      managerMultiAddress,
      account,
      currentNonce,
      accessCode,
    );

    if (!result) {
      throw new Error("Failed to connect to manager");
    }

    setSession({
      connectedOn: Math.floor(Date.now() / 1000),
      account,
      accessCode,
      managerPeerId: result.peer,
      managerPublicKey: result.pubkey,
      managerMultiAddress: managerMultiAddress.toString(),
    });

    return result;
  };

  const disconnect = async () => {
    const workerStore = useWorkerStore();
    const { worker } = storeToRefs(workerStore);

    if (!worker.value) {
      throw new Error("Worker not initialized");
    }

    await worker.value.stop();
    await workerStore.destroy();

    account.value = null;
    connectedOn.value = null;
    managerPeerId.value = null;
    managerPublicKey.value = null;
    accessCode.value = undefined;
  };

  return {
    connectedOn,
    account,
    managerPeerId,
    managerPublicKey,
    managerMultiAddress,

    useActiveSession,

    connect,
    disconnect,
  };
});
