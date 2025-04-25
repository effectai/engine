import { createWorker, Task } from "@effectai/protocol";
import { multiaddr } from "@multiformats/multiaddr";
import { PublicKey } from "@solana/web3.js";
import { useQueryClient } from "@tanstack/vue-query";
import { IDBDatastore } from "datastore-idb";
import { defineStore } from "pinia";
import { useWallet } from "solana-wallets-vue";

export const useWorkerStore = defineStore("worker", {
  state: () => ({
    worker: null as Awaited<ReturnType<typeof createWorker>> | null,
    connectedOn: null as number | null,
    latency: null as number | null,
    latencyInterval: null as NodeJS.Timer | null,
    workerPeerId: null as string | null,
    managerPeerId: null as string | null,
    managerPublicKey: null as PublicKey | null,
    taskUpdateEvent: createEventHook<{ detail: Task }>(),
    taskCounter: 0,
    paymentCounter: 0,
  }),

  getters: {
    managerRecipientDataAccount: (state) => {
      const { deriveWorkerManagerDataAccount } = usePaymentProgram();
      const { publicKey } = useWallet();

      if (!publicKey.value || !state.managerPublicKey) {
        return null;
      }

      return deriveWorkerManagerDataAccount(
        publicKey.value,
        new PublicKey(state.managerPublicKey),
      );
    },
  },

  actions: {
    async initialize(privateKey: Uint8Array) {
      const datastore = new IDBDatastore("/tmp/worker");
      await datastore.open();

      const config = useRuntimeConfig();
      const managerNodeMultiAddress = config.public.EFFECT_MANAGER_MULTIADDRESS;

      this.worker = await createWorker({
        datastore,
        privateKey,
      });

      await this.worker.start();

      this.worker.events.addEventListener(
        "task:created",
        async ({ detail }) => {
          this.taskCounter++;
        },
      );

      this.worker.events.addEventListener("payment:created", ({ detail }) => {
        this.paymentCounter++;
      });

      // this.latencyInterval = setInterval(async () => {
      //   if (this.worker && this.connectedOn) {
      //     const latency = await this.worker.ping(
      //       multiaddr(managerNodeMultiAddress),
      //     );
      //     this.latency = latency;
      //   }
      // }, 5000);
    },

    async disconnect() {
      if (this.worker) {
        await this.worker.stop();

        this.managerPeerId = null;
        this.workerPeerId = null;
        this.managerPublicKey = null;
        this.connectedOn = null;
      }
    },

    async connect(managerMultiAddress: string, currentNonce: bigint) {
      const { publicKey } = useWallet();

      if (!this.worker) {
        throw new Error("Worker not initialized");
      }

      if (!publicKey.value) {
        throw new Error("Wallet not connected");
      }

      const result = await this.worker.connect(
        multiaddr(managerMultiAddress),
        publicKey.value.toBase58(),
        currentNonce,
      );

      if (!result) {
        throw new Error("Failed to connect to manager");
      }

      this.managerPublicKey = new PublicKey(result.pubkey);
      this.connectedOn = Math.floor(Date.now() / 1000);
      this.managerPeerId =
        multiaddr(managerMultiAddress).getPeerId()?.toString() || null;
      this.workerPeerId = this.worker.entity.getPeerId()?.toString() || null;
    },
  },
});
