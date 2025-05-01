import { TypedEventEmitter, type PrivateKey } from "@libp2p/interface";
import { webSockets } from "@libp2p/websockets";
import type { Datastore } from "interface-datastore";

import { createTaskManager } from "./modules/createTaskManager.js";
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
import { buildEddsa } from "circomlibjs";
import { HttpTransport } from "../core/transports/http.js";
import { managerLogger } from "../core/logging.js";
import { createWorkerManager } from "./modules/createWorkerManager.js";
import { bigIntToBytes32, compressBabyJubJubPubKey } from "./utils.js";
import { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE } from "./consts.js";

export type ManagerInfoResponse = {
  status: string;
  peerId: string;
  announcedAddresses: string[];
  requireAccessCodes: boolean;
  publicKey: string;
  connectedPeers: number;
  pendingTasks: number;
  completedTasks: number;
};

export type ManagerEvents = {
  "task:created": (task: TaskRecord) => void;
  "task:accepted": CustomEvent<TaskRecord>;
  "task:rejected": (task: TaskRecord) => void;
  "task:submission": (task: TaskRecord) => void;
  "task:completed": CustomEvent<TaskRecord>;
  "payment:created": (payment: Payment) => void;
};

export type ManagerEntity = Awaited<ReturnType<typeof createManagerEntity>>;

export type ManagerSettings = {
  port: number;
  autoManage: boolean;
  listen: string[];
  announce: string[];
  paymentBatchSize: number;
  requireAccessCodes: boolean;
};

export const createManagerEntity = async ({
  datastore,
  privateKey,
  listen,
  announce,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
  listen: string[];
  announce: string[] | undefined;
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
        listen,
        announce: announce || [],
        transports: [webSockets()],
      }),
    ],
  });
};

export const createManager = async ({
  datastore,
  privateKey,
  settings,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
  settings: Partial<ManagerSettings>;
}) => {
  const managerSettings: ManagerSettings = {
    port: settings.port ?? 19955,
    autoManage: settings.autoManage ?? true,
    listen: settings.listen ?? [`/ip4/0.0.0.0/tcp/${settings.port}/ws`],
    announce: settings.announce ?? [],
    paymentBatchSize: settings.paymentBatchSize ?? PAYMENT_BATCH_SIZE,
    requireAccessCodes: settings.requireAccessCodes ?? true,
  };

  // create the entity
  const entity = await createManagerEntity({
    datastore,
    privateKey,
    listen: managerSettings.listen,
    announce: managerSettings.announce,
  });

  // initialize the stores
  const paymentStore = createPaymentStore({ datastore });
  const templateStore = createTemplateStore({ datastore });
  const taskStore = createManagerTaskStore({ datastore });

  // setup event emitter
  const events = new TypedEventEmitter<ManagerEvents>();

  // create manager modules
  const workerManager = createWorkerManager({
    datastore,
    managerSettings,
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

  // register message handlers
  entity
    .onMessage(
      "requestToWork",
      async ({ recipient, nonce, accessCode }, { peerId }) => {
        await workerManager.connectWorker(
          peerId.toString(),
          recipient,
          nonce,
          accessCode,
        );

        const eddsa = await buildEddsa();
        const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));

        const compressedPubKey = compressBabyJubJubPubKey(
          bigIntToBytes32(eddsa.F.toObject(pubKey[0])),
          bigIntToBytes32(eddsa.F.toObject(pubKey[1])),
        );

        const solanaPublicKey = new PublicKey(compressedPubKey);

        return {
          requestToWorkResponse: {
            timestamp: Math.floor(Date.now() / 1000),
            pubkey: solanaPublicKey.toBase58(),
            batchSize: managerSettings.paymentBatchSize,
          },
        };
      },
    )
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
    const pendingTasks = await taskManager.getActiveTasks();
    const completedTasks = await taskManager.getCompletedTasks();

    const eddsa = await buildEddsa();
    const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));

    const compressedPubKey = compressBabyJubJubPubKey(
      bigIntToBytes32(eddsa.F.toObject(pubKey[0])),
      bigIntToBytes32(eddsa.F.toObject(pubKey[1])),
    );

    const announcedAddresses =
      managerSettings.announce.length === 0
        ? [entity.getMultiAddress()?.[0]]
        : managerSettings.announce;

    res.json({
      status: "running",
      peerId: entity.getPeerId().toString(),
      version: "0.0.1",
      requireAccessCodes: managerSettings.requireAccessCodes,
      announcedAddresses,
      publicKey: new PublicKey(compressedPubKey),
      connectedPeers: workerManager.workerQueue.queue.length,
      pendingTasks: pendingTasks.length,
      completedTasks: completedTasks.length,
    });
  });

  entity.post("/template/register", async (req, res) => {
    const { template, providerPeerIdStr } = req.body;
    try {
      await taskManager.registerTemplate({
        template,
        providerPeerIdStr,
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

  //TODO::
  //make post endpoint to ban/remove peers
  entity.post("/peer/remove", async (req, res) => {
    const { peerId } = req.body;
    try {
      await entity.node.peerStore.delete(peerId);
      await entity.node.hangUp(peerId);
      res.json({ status: "Peer removed", peerId });
    } catch (e: unknown) {
      console.error("Error removing peer", e);
      if (e instanceof Error) {
        res.status(500).json({
          status: "Error removing peer",
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

  if (managerSettings.autoManage) {
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

  // Register event listeners
  entity.node.addEventListener("peer:disconnect", (event) => {
    const peerId = event.detail;
    managerLogger.info(`Peer disconnected: ${peerId.toString()}`);
    workerManager.workerQueue.removePeer(peerId.toString());
  });

  return {
    entity,
    events,

    taskManager,
    workerManager,

    start,
    stop,
  };
};
