// Modify the last 4 bits of the last byte
import {
  createWorker,
  type Ed25519PrivateKey,
  generateKeyPairFromSeed,
  type Multiaddr,
  multiaddr,
  peerIdFromPrivateKey,
} from "@effectai/protocol";
import { IDBDatastore } from "datastore-idb";
import { defineStore } from "pinia";

export const useWorkerStore = defineStore("worker", () => {
  const instance: Ref<null | Awaited<ReturnType<typeof createWorker>>> =
    ref(null);
  const status = ref<"idle" | "initializing" | "active" | "error">("idle");

  const keypair = ref<null | Ed25519PrivateKey>(null);
  const datastore = shallowRef<IDBDatastore | null>(null);

  const peerId = computed(() => {
    if (!keypair.value) return null;
    return peerIdFromPrivateKey(keypair.value);
  });

  const isInitialized = computed(() => {
    return status.value === "active" && instance.value !== null;
  });

  const initialize = async (privateKey: Uint8Array) => {
    if (isInitialized.value) return;

    status.value = "initializing";
    keypair.value = await generateKeyPairFromSeed("Ed25519", privateKey);

    datastore.value = new IDBDatastore(
      `/effect-ai/p4/worker/${peerId.value?.toString()}`,
    );

    await datastore.value.open();

    instance.value = await createWorker({
      datastore: datastore.value,
      privateKey: keypair.value,
      autoExpire: true,
    });

    await instance.value.start();
    status.value = "active";
  };

  const destroy = async () => {
    if (instance.value) {
      await instance.value.stop();
      instance.value = null;
    }

    if (datastore.value) {
      datastore.value = null;
    }
  };

  return {
    instance,
    peerId,
    status,
    initialize,
    isInitialized,
    destroy,
    datastore,
    keypair,
  };
});
