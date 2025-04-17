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
import { bigIntToUint8Array } from "../core/utils.js";
import { buildEddsa } from "circomlibjs";
import { HttpTransport } from "../core/transports/http.js";
import { managerLogger } from "../core/logging.js";
import { createWorkerManager } from "./modules/createWorkerManager.js";

export type ManagerEvents = {
  "task:created": (task: TaskRecord) => void;
  "task:accepted": CustomEvent<TaskRecord>;
  "task:rejected": (task: TaskRecord) => void;
  "task:submission": (task: TaskRecord) => void;
  "task:completed": CustomEvent<TaskRecord>;
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
      new HttpTransport({ port: 8889 }),
      new Libp2pTransport({
        autoStart: true,
        datastore,
        privateKey,
        listen: ["/ip4/0.0.0.0/tcp/0/ws"],
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
  autoManage = true,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
  autoManage?: boolean;
}) => {
  const entity = await createManagerEntity({
    datastore,
    privateKey,
  });

  const paymentStore = createPaymentStore({ datastore });
  const templateStore = createTemplateStore({ datastore });
  const taskStore = createManagerTaskStore({ datastore });

  const events = new TypedEventEmitter<ManagerEvents>();

  const workerManager = createWorkerManager({
    manager: entity,
    datastore,
  });

  const paymentManager = await createPaymentManager({
    workerManager,
    privateKey,
    paymentStore,
  });

  const taskManager = createTaskManager({
    manager: entity,
    events,

    taskStore,
    templateStore,

    paymentManager,
    workerManager,
  });

  entity
    .onMessage("requestToWork", async ({ recipient, nonce }, { peerId }) => {
      //add the peerId to the worker queue
      await workerManager.connectWorker(peerId.toString(), recipient, nonce);

      const eddsa = await buildEddsa();
      const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));

      managerLogger.info(`Sucessfully registered worker ${peerId.toString()}`);

      return {
        requestToWorkResponse: {
          timestamp: Math.floor(Date.now() / 1000),
          pubX: pubKey[0],
          pubY: pubKey[1],
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

  // Register http routes for manager
  entity.post("/task", async (req, res) => {
    const task = req.body;
    try {
      //save task in manager store
      await taskManager.createTask({
        task,
        providerPeerIdStr: entity.getPeerId().toString(),
      });
      res.json({ status: "Task received", task });
    } catch (e: unknown) {
      console.error("Error creating task", e);
      if (e instanceof Error) {
        res.status(500).json({
          status: "Error creating task",
          error: e.message,
        });
      }
    }
  });

  entity.get("/", async (req, res) => {
    const pendingTasks = await taskManager.getPendingTasks();
    const completedTasks = await taskManager.getCompletedTasks();

    res.json({
      status: "Manager is running",
      peerId: entity.getPeerId().toString(),
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasks.length,
    });
  });

  entity.post("/template/register", async (req, res) => {
    const template = req.body;
    try {
      await taskManager.registerTemplate({
        template,
        providerPeerIdStr: entity.getPeerId().toString(),
      });
      res.json({ status: "Template registered", id: template.templateId });
    } catch (e: unknown) {
      console.error("Error creating template", e);
      if (e instanceof Error) {
        res.status(500).json({
          status: "Error creating template",
          error: e.message,
        });
      }
    }
  });

  let isStarted = false;
  const start = async () => {
    //start libp2p & http transports
    await entity.node.start();
    await entity.startHttp();
    isStarted = true;
  };

  const stop = async () => {
    //stop libp2p & http transports
    await entity.node.stop();
    await entity.stopHttp();
    isStarted = false;
  };

  if (autoManage) {
    await start();

    const MANAGEMENT_INTERVAL = 5000;
    let isRunning = false;
    let lastRunTime = 0;

    const runManagementCycle = async () => {
      if (isStarted === false) {
        return;
      }

      if (isRunning) {
        console.log("Management cycle skipped - already running");
        return;
      }

      try {
        isRunning = true;
        lastRunTime = Date.now();
        await taskManager.manageTasks();
      } catch (err) {
        console.error("Management cycle error:", err);
      } finally {
        isRunning = false;
        const elapsed = Date.now() - lastRunTime;
        const nextRun = Math.max(0, MANAGEMENT_INTERVAL - elapsed);
        setTimeout(runManagementCycle, nextRun);
      }
    };

    runManagementCycle();
  }

  return {
    entity,
    events,

    taskManager,
    workerManager,

    start,
    stop,
  };
};
