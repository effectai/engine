import { TypedEventEmitter, type PrivateKey } from "@libp2p/interface";
import { webSockets } from "@libp2p/websockets";
import type { Datastore } from "interface-datastore";

import { createTaskManager } from "./modules/createTaskManager.js";
import { createWorkerQueue } from "./modules/createWorkerQueue.js";
import { createPaymentManager } from "./modules/createPaymentManager.js";
import { createManagerTaskStore } from "./stores/managerTaskStore.js";
import type { TaskRecord } from "../core/common/types.js";
import { createEffectEntity } from "../core/entity/factory.js";
import {
  type Payment,
  EffectProtocolMessage,
} from "../core/messages/effect.js";
import { Libp2pTransport } from "../core/transports/libp2p.js";
import { createPaymentStore } from "../core/common/stores/paymentStore.js";
import { createTemplateStore } from "../core/common/stores/templateStore.js";
import { createTemplateManager } from "./modules/createTemplateManager.js";
import { randomBytes } from "node:crypto";
import { bigIntToUint8Array } from "../core/utils.js";
import { managerLogger } from "../core/logging.js";

export type ManagerEvents = {
  "task:created": (task: TaskRecord) => void;
  "task:accepted": (task: TaskRecord) => void;
  "task:rejected": (task: TaskRecord) => void;
  "task:submission": (task: TaskRecord) => void;
  "task:completed": (task: TaskRecord) => void;
  "payment:created": (payment: Payment) => void;
};

export const createManagerEntity = async ({
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
        autoStart: true,
        datastore,
        privateKey,
        listen: ["/ip4/0.0.0.0/tcp/34861/ws"],
        services: {},
        transports: [webSockets()],
      }),
    ],
  });
};

export type ManagerEntity = Awaited<ReturnType<typeof createManagerEntity>>;

export const createManager = async ({
  datastore,
  privateKey,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
}) => {
  const entity = await createManagerEntity({
    datastore,
    privateKey,
  });

  const paymentStore = createPaymentStore({ datastore });
  const templateStore = createTemplateStore({ datastore });
  const taskStore = createManagerTaskStore({ datastore });

  const workerQueue = createWorkerQueue();
  const events = new TypedEventEmitter<ManagerEvents>();

  const paymentManager = createPaymentManager({
    peerStore: entity.node.peerStore,
    privateKey,
    paymentStore,
  });

  const taskManager = createTaskManager({
    manager: entity,
    events,
    workerQueue,
    taskStore,
    paymentManager,
    templateStore,
  });

  const templateManager = createTemplateManager({
    templateStore,
  });

  entity
    .onMessage("requestToWork", async ({ recipient, nonce }, { peerId }) => {
      //save nonce & recipient in peerStore and set last payout to now
      await entity.node.peerStore.merge(peerId, {
        metadata: {
          recipient: new TextEncoder().encode(recipient),
          nonce: bigIntToUint8Array(nonce),
          lastPayout: new TextEncoder().encode((Date.now() / 1000).toString()),
        },
      });

      //add the peerId to the worker queue
      workerQueue.addPeer({ peerIdStr: peerId.toString() });

      return {
        // we respond with our jubjub key
        requestToWorkResponse: {
          pubX: randomBytes(32),
          pubY: randomBytes(32),
        },
      };
    })
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
    .onMessage("proofRequest", async (proofRequest, { peerId }) => {
      return await paymentManager.processProofRequest({
        privateKey,
        peerId,
        payments: proofRequest.payments,
      });
    })
    .onMessage("payoutRequest", async (payoutRequest, { peerId }) => {
      const payment = await paymentManager.processPayoutRequest({
        peerId,
      });

      return {
        payment,
      };
    })
    .onMessage("templateRequest", async (template, { peerId }) => {
      const record = await templateStore.get({ entityId: template.templateId });

      return {
        templateResponse: { ...record?.state },
      };
    });

  const start = () => {
    return entity.node.start();
  };

  const stop = () => {
    return entity.node.stop();
  };

  return {
    entity,

    events,

    taskManager,
    templateManager,

    start,
    stop,
  };
};
