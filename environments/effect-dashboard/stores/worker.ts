import { createWorker, Task } from "@effectai/protocol";
import { multiaddr } from "@multiformats/multiaddr";
import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/vue-query";
import { IDBDatastore } from "datastore-idb";
import { defineStore } from "pinia";
import { useWallet } from "solana-wallets-vue";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

export const useWorkerStore = defineStore("worker", () => {
  const worker: Ref<null | Awaited<ReturnType<typeof createWorker>>> =
    ref(null);
  const connectedOn: Ref<null | number> = ref(null);
  const latency: Ref<null | number> = ref(null);
  const latencyInterval: Ref<null | NodeJS.Timer> = ref(null);
  const workerPeerId: Ref<null | string> = ref(null);
  const managerPeerId: Ref<null | string> = ref(null);
  const managerPublicKey: Ref<null | PublicKey> = ref(null);
  const taskCounter: Ref<number> = ref(0);
  const paymentCounter: Ref<number> = ref(0);
  const pingControls = ref<null | ReturnType<typeof useIntervalFn>>(null);

  const initialize = async (privateKey: Uint8Array) => {
    const keypair = await generateKeyPairFromSeed("Ed25519", privateKey);
    const peerId = peerIdFromPrivateKey(keypair);

    const datastore = new IDBDatastore(`/tmp/worker/${peerId.toString()}`);
    await datastore.open();

    const config = useRuntimeConfig();
    const managerNodeMultiAddress = config.public.EFFECT_MANAGER_MULTIADDRESS;

    worker.value = await createWorker({
      datastore,
      privateKey,
      autoExpire: true,
    });

    await worker.value.start();

    worker.value.events.addEventListener("task:created", ({ detail }) => {
      taskCounter.value += 1;
    });

    worker.value.events.addEventListener("payment:created", ({ detail }) => {
      paymentCounter.value += 1;
    });

    pingControls.value = useIntervalFn(
      async () => {
        if (worker.value && connectedOn.value) {
          latency.value = await worker.value.ping(
            multiaddr(managerNodeMultiAddress),
          );
        }
      },
      5000,
      { immediate: false, immediateCallback: true },
    );
  };

  const disconnect = async () => {
    if (worker.value) {
      await worker.value.stop();

      managerPeerId.value = null;
      workerPeerId.value = null;
      managerPublicKey.value = null;
      connectedOn.value = null;
    }
  };

  const connect = async (managerMultiAddress: string, currentNonce: bigint) => {
    const { publicKey } = useWallet();

    if (!worker.value) {
      throw new Error("Worker not initialized");
    }

    if (!publicKey.value) {
      throw new Error("Wallet not connected");
    }

    const result = await worker.value.connect(
      multiaddr(managerMultiAddress),
      publicKey.value.toBase58(),
      currentNonce,
    );

    if (!result) {
      throw new Error("Failed to connect to manager");
    }

    managerPublicKey.value = new PublicKey(result.pubkey);
    connectedOn.value = Math.floor(Date.now() / 1000);
    managerPeerId.value =
      multiaddr(managerMultiAddress).getPeerId()?.toString() || null;
    workerPeerId.value = worker.value.entity.getPeerId()?.toString() || null;
    pingControls.value?.resume();
  };

  return {
    worker,
    connectedOn,
    latency,
    latencyInterval,
    workerPeerId,
    managerPeerId,
    managerPublicKey,
    taskCounter,
    paymentCounter,
    pingControls,
    initialize,
    disconnect,
    connect,
  };
});
