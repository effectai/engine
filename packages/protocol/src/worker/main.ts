import { circuitRelayTransport } from "@libp2p/circuit-relay-v2";
import { type PrivateKey, TypedEventEmitter } from "@libp2p/interface";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { webTransport } from "@libp2p/webtransport";
import type { Datastore } from "interface-datastore";
import { session } from "../core/common/SessionService.js";
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
import { Multiaddr } from "@multiformats/multiaddr";
import { randomBytes } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export type WorkerEvents = {
  "task:created": (task: Task) => void;
  "task:completed": (task: TaskRecord) => void;
  "task:accepted": (task: TaskRecord) => void;
  "task:rejected": (task: TaskRecord) => void;
  "payment:created": (payment: Payment) => void;
};

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
  const entity = await createWorkerEntity({
    datastore,
    privateKey,
  });

  // register worker modules
  const events = new TypedEventEmitter<WorkerEvents>();

  const taskStore = createWorkerTaskStore({ datastore });
  const paymentStore = createPaymentStore({ datastore });
  const templateStore = createTemplateStore({ datastore });

  const templateWorker = createTemplateWorker({ entity, templateStore });
  const { requestPayout } = createPaymentWorker({ entity, taskStore });
  const { acceptTask, rejectTask, completeTask, renderTask, getTask } =
    createTaskWorker({
      entity,
      events,
      taskStore,
      templateWorker,
    });

  // register message handlers
  entity
    .onMessage("task", async (task, { peerId }) => {
      await taskStore.create({ task, managerPeerId: peerId });
      events.safeDispatchEvent("task:created", { detail: task });
    })
    .onMessage("payment", async (payment, { peerId }) => {
      await paymentStore.create({
        payment,
        peerId: peerId.toString(),
      });
      events.safeDispatchEvent("payment:created", { detail: payment });
    });

  const start = async () => {
    await entity.node.start();
  };

  const stop = async () => {
    await entity.node.stop();
  };

  const connect = async (manager: Multiaddr) => {
    const result = await entity.sendMessage(manager, {
      requestToWork: {
        timestamp: Date.now() / 1000,
        recipient: new PublicKey(randomBytes(32)).toString(),
        nonce: 32n,
      },
    });
    //TODO:: handle result
  };

  return {
    entity,
    events,

    requestPayout,
    acceptTask,
    rejectTask,
    completeTask,
    renderTask,
    getTask,

    connect,
    start,
    stop,
  };
};
