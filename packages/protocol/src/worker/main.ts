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
import { createPaymentStore } from "../core/stores/paymentStore.js";
import { Libp2pTransport } from "../core/transports/libp2p.js";
import { createPaymentWorker } from "./modules/createPaymentWorker.js";
import { createTaskWorker } from "./modules/createTaskWorker.js";
import { createWorkerTaskStore } from "./stores/workerTaskStore.js";

export type WorkerEvents = {
  "task:created": (task: Task) => void;
  "task:completed": (task: TaskRecord) => void;
  "task:accepted": (task: TaskRecord) => void;
  "task:rejected": (task: TaskRecord) => void;
  "payment:created": (payment: Payment) => void;
};

export const createWorker = async ({
  datastore,
  privateKey,
  bootstrap,
  getSessionData,
}: {
  bootstrap: string[];
  datastore: Datastore;
  privateKey: PrivateKey;
  getSessionData: () => {
    recipient: string;
    nonce: bigint;
  };
}) => {
  const eventEmitter = new TypedEventEmitter<WorkerEvents>();

  const taskStore = createWorkerTaskStore({ datastore });
  const paymentStore = createPaymentStore({ datastore });

  const worker = await createEffectEntity({
    transports: [
      new Libp2pTransport({
        privateKey,
        autoStart: false,
        bootstrap,
        listen: ["/p2p-circuit", "/webrtc"],
        services: {
          session: session({
            getData: () => ({
              role: "worker",
              ...getSessionData(),
            }),
          }),
        },
        transports: [
          webSockets(),
          webRTC(),
          webTransport(),
          circuitRelayTransport(),
        ],
        protocol: {
          name: "/effectai/1.0.0",
          scheme: EffectProtocolMessage,
        },
      }),
    ],
    datastore,
  });

  const { requestPayout } = createPaymentWorker({ taskStore, worker });

  const { acceptTask, rejectTask, completeTask, getTask } = createTaskWorker({
    eventEmitter,
    taskStore,
    worker,
  });

  worker
    .onMessage("task", async (task, { peerId }) => {
      await taskStore.create({ task, managerPeerId: peerId });
      eventEmitter.safeDispatchEvent("task:created", { detail: task });
    })
    .onMessage("payment", async (payment, { peerId }) => {
      await paymentStore.create({
        payment,
      });
      eventEmitter.safeDispatchEvent("payment:created", { detail: payment });
    })
    .onMessage("proofResponse", async (response, { peerId }) => {});

  worker.getNode().addEventListener("start", () => {});

  return {
    node: worker,
    eventEmitter,
    taskStore,

    requestPayout,
    acceptTask,
    rejectTask,
    completeTask,
  };
};
