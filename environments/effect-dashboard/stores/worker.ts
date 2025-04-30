import { createWorker } from "@effectai/protocol";
import { type Multiaddr } from "@multiformats/multiaddr";
import { IDBDatastore } from "datastore-idb";
import { defineStore } from "pinia";
import { peerIdFromPrivateKey } from "@libp2p/peer-id";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";

export const useWorkerStore = defineStore("worker", () => {
  const worker: Ref<null | Awaited<ReturnType<typeof createWorker>>> =
    ref(null);

  const workerPeerId: Ref<null | string> = ref(null);

  const taskCounter: Ref<number> = ref(0);
  const paymentCounter: Ref<number> = ref(0);

  const ping = async (multiaddr: Multiaddr) => {
    return await worker.value?.ping(multiaddr);
  };

  const initialize = async (privateKey: Uint8Array) => {
    const keypair = await generateKeyPairFromSeed("Ed25519", privateKey);
    const peerId = peerIdFromPrivateKey(keypair);
    workerPeerId.value = peerId.toString();

    const datastore = new IDBDatastore(`/tmp/worker/${peerId.toString()}`);
    await datastore.open();

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
  };

  const privateKey = useLocalStorage("privateKey", null);
  watchEffect(async () => {
    if (!privateKey.value || worker.value) {
      return;
    }

    const privateKeyBytes = Buffer.from(privateKey.value, "hex").slice(0, 32);
    await initialize(privateKeyBytes);
  });

  return {
    worker,
    workerPeerId,
    initialize,
    ping,
    taskCounter,
    paymentCounter,
  };
});
