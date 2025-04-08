import { TypedEventEmitter, type PrivateKey } from "@libp2p/interface";
import { webSockets } from "@libp2p/websockets";
import type { Datastore } from "interface-datastore";

import { createTaskManager } from "./modules/createTaskManager.js";
import { createWorkerQueue } from "./modules/createWorkerQueue.js";
import { createPaymentManager } from "./modules/createPaymentManager.js";
import { createManagerTaskStore } from "./stores/managerTaskStore.js";
import type { TaskRecord } from "../core/common/types.js";
import { createEffectEntity } from "../core/entity/factory.js";
import { managerLogger } from "../core/logging.js";
import {
  type Payment,
  EffectProtocolMessage,
} from "../core/messages/effect.js";
import { createPaymentStore } from "../core/stores/paymentStore.js";
import { session } from "../core/common/SessionService.js";
import { Libp2pTransport } from "../core/transports/libp2p.js";

export type ManagerEvents = {
  "task:created": (task: TaskRecord) => void;
  "task:accepted": (task: TaskRecord) => void;
  "task:rejected": (task: TaskRecord) => void;
  "task:submission": (task: TaskRecord) => void;
  "task:completed": (task: TaskRecord) => void;
  "payment:created": (payment: Payment) => void;
};

export const createManager = async ({
  datastore,
  privateKey,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
}) => {
  const paymentStore = createPaymentStore({ datastore });
  const taskStore = createManagerTaskStore({ datastore });

  const workerQueue = createWorkerQueue();
  const eventEmitter = new TypedEventEmitter<ManagerEvents>();

  const manager = await createEffectEntity({
    transports: [
      new Libp2pTransport({
        privateKey,
        autoStart: true,
        listen: ["/ip4/0.0.0.0/tcp/34861/ws"],
        services: {
          session: session({
            getData: () => ({
              role: "manager",
              pub_x: "0x1234567890abcdef",
              pub_y: "0xabcdef1234567890",
            }),
          }),
        },
        transports: [webSockets()],
        protocol: {
          name: "/effectai/1.0.0",
          scheme: EffectProtocolMessage,
        },
        onConnect: async ({
          peerStore,
          sessionService,
          peerId,
          connection,
        }) => {
          try {
            // handshake for generic session data.
            const { role, nonce, recipient } =
              await sessionService.peformHandshakeInitiator(connection);

            // set last payout on connect..
            const lastPayoutTimestamp = Math.floor(Date.now() / 1000);
            peerStore.merge(peerId, {
              metadata: {
                "session:lastPayout": new TextEncoder().encode(
                  lastPayoutTimestamp.toString(),
                ),
              },
            });

            // add worker to queue
            if (role === "worker" && nonce && recipient) {
              managerLogger.info(
                { peer: peerId.toString(), recipient, nonce },
                "Worker connected",
              );

              workerQueue.addPeer({ peerIdStr: peerId.toString() });
            }
          } catch (err) {
            console.error("Error in handshake initiator:", err);
          }
        },
      }),
    ],
    datastore,
  });

  const paymentManager = createPaymentManager({
    privateKey,
    peerStore: manager.getNode().peerStore,
    paymentStore,
  });

  const taskManager = createTaskManager({
    eventEmitter,
    manager,
    workerQueue,
    taskStore,
    paymentManager,
  });

  manager
    .onMessage("task", async (task, { peerId }) => {
      await taskManager.createTask({
        task,
        providerPeerIdStr: peerId.toString(),
      });
    })
    .onMessage("taskAccepted", async ({ taskId }, { peerId }) => {
      await taskManager.processTaskAcception({
        taskId,
        workerPeerIdStr: peerId.toString(),
      });
    })
    .onMessage("taskCompleted", async ({ taskId, result }, { peerId }) => {
      await taskManager.processTaskSubmission({
        taskId,
        result,
        workerPeerIdStr: peerId.toString(),
      });
    })
    .onMessage("taskRejected", async ({ taskId, reason }, { peerId }) => {
      await taskManager.processTaskRejection({
        taskId,
        reason,
        workerPeerIdStr: peerId.toString(),
      });
    })
    .onMessage("proofRequest", async (proofRequest, { connection, peerId }) => {
      const msg = await paymentManager.generatePaymentProof(
        privateKey,
        proofRequest.payments,
      );

      // send the proof to the worker
      manager.sendMessage(peerId, msg);
    })
    .onMessage(
      "payoutRequest",
      async (payoutRequest, { connection, peerId }) => {
        const payment = await paymentManager.generatePayout({ peerId });

        // send the payment to the worker
        manager.sendMessage(peerId, { payment });
      },
    )
    .onMessage("template", async (template, { peerId }) => {
      // worker requested a template
      // TODO::
    });

  return {
    node: manager,
    eventEmitter,
    taskStore,
    taskManager,
  };
};
