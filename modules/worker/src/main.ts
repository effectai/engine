import { webRTC } from "@libp2p/webrtc";
import { createPaymentWorker } from "./modules/createPaymentWorker.js";
import { createTaskWorker } from "./modules/createTaskWorker.js";
import { createWorkerTaskStore } from "./stores/workerTaskStore.js";
import { createTemplateWorker } from "./modules/createTemplateWorker.js";
// import type { PingService } from "@libp2p/ping";

import {
  Libp2pTransport,
  TypedEventEmitter,
  type PrivateKey,
  type TaskRecord,
  type Datastore,
  type Multiaddr,
  webSockets,
  createEffectEntity,
  createPaymentStore,
  createTemplateStore,
  generateKeyPairFromSeed,
  circuitRelayTransport,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
} from "@effectai/protocol-core";
import { PingService } from "@libp2p/ping";

import { EffectProtocolMessage, Payment, Task } from "@effectai/protobufs";

export interface WorkerEvents {
  "task:created": CustomEvent<Task>;
  "task:completed": (task: TaskRecord) => void;
  "task:accepted": CustomEvent<Task>;
  "task:rejected": (task: TaskRecord) => void;
  "task:expired": (task: TaskRecord) => void;
  "payment:created": CustomEvent<Payment>;
}

export const createWorkerEntity = async ({
  datastore,
  privateKey,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
}) => {
  return await createEffectEntity({
    protocol: {
      name: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      scheme: EffectProtocolMessage,
    },
    transports: [
      new Libp2pTransport({
        privateKey,
        datastore,
        autoStart: false,
        listen: ["/p2p-circuit", "/webrtc"],
        announce: [],
        transports: [webSockets(), webRTC(), circuitRelayTransport()],
      }),
    ],
  });
};

export type WorkerEntity = Awaited<ReturnType<typeof createWorkerEntity>>;

export const createWorker = async ({
  datastore,
  privateKey,
  autoExpire = true,
}: {
  datastore: Datastore;
  privateKey: Uint8Array | PrivateKey;
  autoExpire: boolean;
}) => {
  const ed25519PrivateKey: PrivateKey =
    privateKey instanceof Uint8Array
      ? await generateKeyPairFromSeed("Ed25519", privateKey)
      : privateKey;

  const events = new TypedEventEmitter<WorkerEvents>();
  const entity = await createWorkerEntity({
    datastore,
    privateKey: ed25519PrivateKey,
  });

  // register stores
  const taskStore = createWorkerTaskStore({ datastore });
  const paymentStore = createPaymentStore({ datastore });
  const templateStore = createTemplateStore({ datastore });

  // register worker modules
  const templateWorker = createTemplateWorker({ entity, templateStore });

  const {
    createPayment,
    getPayments,
    getPaginatedPayments,
    countPaymentAmount,
    requestPayout,
    getPaymentsFromNonce,
    requestPaymentProof,
    requestBulkProofs,
    getMaxNonce,
  } = createPaymentWorker({
    entity,
    events,
    paymentStore,
  });

  const {
    createTask,
    acceptTask,
    rejectTask,
    completeTask,
    renderTask,
    getTask,
    getTasks,
    cleanup,
  } = createTaskWorker({
    entity,
    events,
    taskStore,
    templateWorker,
  });

  // register message handlers
  entity
    .onMessage("task", async (task, { peerId }) => {
      await createTask({ task, managerPeerId: peerId });
    })
    .onMessage("payment", async (payment, { peerId }) => {
      await createPayment({ payment, managerPeerId: peerId });
    });

  const start = async () => {
    await entity.node.start();
  };

  const stop = async () => {
    await entity.node.stop();
  };

  // request a manager to identify itself
  const identify = async (manager: Multiaddr) => {
    const [response, _error] = await entity.sendMessage(manager, {
      identifyRequest: {
        timestamp: Math.floor(Date.now() / 1000),
      },
    });

    if (!response) {
      throw new Error("Failed to identify manager");
    }

    return response;
  };

  //connect to an identified manager
  const connect = async (
    multiaddress: Multiaddr,
    {
      recipient,
      nonce,
      capabilities,
      accessCode,
    }: {
      recipient: string;
      nonce: bigint;
      capabilities: string[];
      accessCode?: string;
    },
  ) => {
    const [response, error] = await entity.sendMessage(multiaddress, {
      requestToWork: {
        timestamp: Math.floor(Date.now() / 1000),
        recipient,
        nonce,
        capabilities: capabilities.join(","),
        accessCode,
      },
    });

    if (error) {
      throw new Error(`Failed to connect to manager: ${error}`);
    }

    return response;
  };

  const ping = async (manager: Multiaddr) => {
    const pingService = entity.node.services.ping as PingService;
    return await pingService.ping(manager);
  };

  if (autoExpire) {
    setInterval(async () => {
      await cleanup();
    }, 1000);
  }

  return {
    entity,
    events,
    taskStore,

    getTask,
    getTasks,
    acceptTask,
    rejectTask,
    completeTask,
    renderTask,
    getMaxNonce,

    getPayments,
    getPaymentsFromNonce,
    getPaginatedPayments,
    countPaymentAmount,
    requestPayout,
    requestPaymentProof,
    requestBulkProofs,
    identify,
    connect,
    start,
    stop,
    ping,
  };
};
