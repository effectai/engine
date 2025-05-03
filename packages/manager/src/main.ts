import {
  type Datastore,
  webSockets,
  TypedEventEmitter,
  type PrivateKey,
} from "@effectai/protocol-core";

import { createPaymentManager } from "./modules/createPaymentManager";
import { createTaskManager } from "./modules/createTaskManager";
import { createManagerTaskStore } from "./stores/managerTaskStore";

import { buildEddsa } from "@effectai/zkp";
import { createWorkerManager } from "./modules/createWorkerManager";
import { bigIntToBytes32, compressBabyJubJubPubKey } from "./utils.js";

import { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE } from "./consts.js";

import { createRequestHandler } from "@remix-run/express";

import {
  type Payment,
  type TaskRecord,
  HttpTransport,
  EffectProtocolMessage,
  Libp2pTransport,
  managerLogger,
  createTemplateStore,
  createPaymentStore,
  createEffectEntity,
} from "@effectai/protocol-core";

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

export type ManagerContext = {
  manager: ManagerEntity;
  taskManager: ReturnType<typeof createTaskManager>;
  workerManager: ReturnType<typeof createWorkerManager>;
};

export type ManagerSettings = {
  port: number;
  autoManage: boolean;
  listen: string[];
  announce: string[];
  paymentBatchSize: number;
  requireAccessCodes: boolean;
  paymentAccount: string | null;
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
    paymentAccount: settings.paymentAccount ?? null,
  };

  if (!managerSettings.paymentAccount) {
    managerLogger.warn(
      "No payment account provided. Payments will not be processed.",
    );
  }

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
    managerSettings,
  });

  const taskManager = createTaskManager({
    manager: entity,
    events,
    taskStore,
    templateStore,

    managerSettings,
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
    .onMessage("payoutRequest", async (_payoutRequest, { peerId }) => {
      const payment = await paymentManager.processPayoutRequest({
        peerId,
      });

      return {
        payment,
      };
    })
    .onMessage("templateRequest", async (template) => {
      const record = await templateStore.get({ entityId: template.templateId });

      return {
        templateResponse: { ...record?.state },
      };
    });

  // Register http routes for manager
  entity.post("/task", async (req, res) => {
    const task = req.body;
    try {
      console.log("Received task:", task);
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

  entity.get("/", async (_req, res) => {
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

  //lets register the dash

  const setupManagerDashboard = async () => {
    async function setupRemix(app: any, context: ManagerContext) {
      //@ts-ignore
      const build = await import("./../admin-dashboard/build/server/index.js");

      const remixHandler = createRequestHandler({
        build,
        mode: process.env.NODE_ENV,
        getLoadContext: () => context,
      });

      app.use((req: any, _res: any, next: any) => {
        // Attach context to request so loaders can access it
        (req as any).remixContext = context;
        next();
      });

      app.all("*", remixHandler);
    }

    //init express server
    const express = await import("express");
    const cors = await import("cors");

    const app = express.default();
    app.use(cors.default()); // 👈 add this line

    app.get("/favicon.ico", (_req: any, res: any) => {
      res.status(204).end(); // No Content
    });

    app.use(express.default.json());

    setupRemix(app, {
      manager: entity,
      taskManager,
      workerManager,
    });

    app.listen(9000, () => {
      console.log("Server is running on port 9000");
    });
  };

  setupManagerDashboard();

  return {
    entity,
    events,

    taskManager,
    workerManager,

    start,
    stop,
  };
};
