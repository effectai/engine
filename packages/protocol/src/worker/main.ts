import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { type PrivateKey, TypedEventEmitter } from "@libp2p/interface";
import { webRTC } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { webTransport } from "@libp2p/webtransport";
import type { Datastore } from "interface-datastore";
import type { TaskRecord } from "../core/common/types.js";
import { createEffectEntity } from "../core/entity/factory.js";
import {
  EffectProtocolMessage,
  type Task,
  type Payment,
} from "../core/messages/effect.js";
import { Libp2pTransport } from "../core/transports/libp2p.js";
import { createPaymentWorker } from "./modules/createPaymentWorker.js";
import { createTaskWorker } from "./modules/createTaskWorker.js";
import { createWorkerTaskStore } from "./stores/workerTaskStore.js";
import { createPaymentStore } from "../core/common/stores/paymentStore.js";
import { createTemplateWorker } from "./modules/createTemplateWorker.js";
import { createTemplateStore } from "../core/common/stores/templateStore.js";
import type { Multiaddr } from "@multiformats/multiaddr";

export interface WorkerEvents {
  "task:created": CustomEvent<Task>;
  "task:completed": (task: TaskRecord) => void;
  "task:accepted": CustomEvent<Task>;
  "task:rejected": (task: TaskRecord) => void;
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
      name: "effectai",
      version: "1.0.0",
      scheme: EffectProtocolMessage,
    },
    transports: [
      new Libp2pTransport({
        privateKey,
        datastore,
        autoStart: false,
        listen: ["/p2p-circuit", "/webrtc"],
        transports: [
          webSockets(),
          webRTC(),
          webTransport(),
          circuitRelayTransport(),
        ],
      }),
    ],
  });
};
export type WorkerEntity = Awaited<ReturnType<typeof createWorkerEntity>>;

export const createWorker = async ({
  datastore,
  privateKey,
  getSessionData,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
  getSessionData: () => {
    recipient: string;
    nonce: bigint;
  };
}) => {
  const events = new TypedEventEmitter<WorkerEvents>();
  const entity = await createWorkerEntity({
    datastore,
    privateKey,
  });

  // register stores
  const taskStore = createWorkerTaskStore({ datastore });
  const paymentStore = createPaymentStore({ datastore });
  const templateStore = createTemplateStore({ datastore });

  // register worker modules
  const templateWorker = createTemplateWorker({ entity, templateStore });
  const { createPayment, getPayments, requestPayout, requestPaymentProof } =
    createPaymentWorker({
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

  const connect = async (manager: Multiaddr) => {
    const [response, error] = await entity.sendMessage(manager, {
      requestToWork: {
        timestamp: Date.now() / 1000,
        ...getSessionData(),
      },
    });

    if (error) {
      throw new Error(`Failed to connect to manager: ${error}`);
    }

    return response;
  };

  return {
    entity,
    events,

    getTask,
    acceptTask,
    rejectTask,
    completeTask,
    renderTask,

    getPayments,
    requestPayout,
    requestPaymentProof,

    connect,
    start,
    stop,
  };
};
