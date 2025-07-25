// Modify the last 4 bits of the last byte
import {
  createWorker,
  multiaddr,
  peerIdFromPrivateKey,
  generateKeyPairFromSeed,
  type Multiaddr,
  type Ed25519PrivateKey,
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
    status.value = "initializing";

    const tagBytes = await generateDeterministicSeed();

    const modifiedSeed = modifySeedLast4Bytes(privateKey, tagBytes);
    keypair.value = await generateKeyPairFromSeed("Ed25519", modifiedSeed);

    datastore.value = new IDBDatastore(
      `/effect-ai/worker/${peerId.value?.toString()}`,
    );

    await datastore.value.open();

    instance.value = await createWorker({
      datastore: datastore.value,
      privateKey,
      autoExpire: true,
    });

    await instance.value.start();
    status.value = "active";
  };

  return {
    instance,
    peerId,
    status,
    initialize,
    isInitialized,
    datastore,
  };
});
