import { multiaddr, type Multiaddr } from "@multiformats/multiaddr";
import { PublicKey } from "@solana/web3.js";
import { useMutation } from "@tanstack/vue-query";

type SessionPayload = {
  account: string;
  connectedOn: number;
  managerPeerId: string;
  managerMultiAddress: string;
  managerPublicKey: string;
  latency?: number;
  accessCode?: string;
};

export const useSessionStore = defineStore("session", () => {
  const account: Ref<PublicKey | null> = ref(null);
  const connectedOn: Ref<number | null> = ref(null);
  const managerPeerId: Ref<string | null> = ref(null);
  const managerPublicKey: Ref<PublicKey | null> = ref(null);
  const managerMultiAddress: Ref<string | null> = ref(null);
  const latency: Ref<number | null> = ref(null);
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

  const useConnect = () =>
    useMutation({
      onSuccess: (data, opts) => {
        setSession({
          account: opts.account,
          connectedOn: Math.floor(Date.now() / 1000),
          managerPeerId: opts.managerPeerId,
          managerPublicKey: opts.managerPublicKey,
          accessCode: opts.accessCode,
          managerMultiAddress: opts.managerMultiAddress,
        });
      },
      mutationFn: async ({
        account,
        managerMultiAddress,
        managerPublicKey,
        accessCode,
        nextNonce,
      }: {
        account: string;
        managerMultiAddress: string;
        managerPeerId: string;
        managerPublicKey: string;
        nextNonce: bigint;
        accessCode?: string;
      }): Promise<Awaited<ReturnType<typeof connect>>> => {
        return await connect(
          account,
          managerMultiAddress,
          nextNonce,
          accessCode,
        );
      },
    });

  const connect = async (
    account: string,
    managerMultiAddress: string,
    currentNonce: bigint,
    accessCode?: string,
  ) => {
    const workerStore = useWorkerStore();
    const { worker } = storeToRefs(workerStore);

    if (!worker.value) {
      throw new Error("Worker not initialized");
    }

    const result = await worker.value.connect(
      multiaddr(managerMultiAddress),
      account,
      currentNonce,
      accessCode,
    );

    if (!result) {
      throw new Error("Failed to connect to manager");
    }

    return result;
  };

  const useDisconnect = () =>
    useMutation({
      mutationFn: async () => {
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
      },
    });

  const config = useRuntimeConfig();
  const payoutInterval = Number.parseInt(config.public.PAYOUT_INTERVAL);

  const payoutIntervalControls = useIntervalFn(
    async () => {
      const workerStore = useWorkerStore();
      const { worker } = storeToRefs(workerStore);

      if (!worker.value) {
        throw new Error("Worker not initialized");
      }

      await worker.value.requestPayout({
        managerPeerIdStr: managerPeerId.value,
      });
    },
    payoutInterval,
    {
      immediate: false,
    },
  );

  const latencyIntervalControls = useIntervalFn(
    async () => {
      const workerStore = useWorkerStore();
      const { worker } = storeToRefs(workerStore);

      if (!worker.value) {
        throw new Error("Worker not initialized");
      }

      if (!managerMultiAddress.value) {
        console.warn("Manager multiaddress is not set");
        return;
      }

      latency.value = await worker.value.ping(
        multiaddr(managerMultiAddress.value),
      );
    },
    5000,
    {
      immediate: false,
    },
  );

  watchEffect(() => {
    if (!connectedOn.value) {
      return;
    }

    latencyIntervalControls.resume();
    payoutIntervalControls.resume();
  });

  return {
    connectedOn,
    account,
    managerPeerId,
    managerPublicKey,
    latency,
    useActiveSession,
    useConnect,
    useDisconnect,
  };
});
