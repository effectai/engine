import {
  type Datastore,
  webSockets,
  TypedEventEmitter,
  type PrivateKey,
  createLogger,
} from "@effectai/protocol-core";

import { createPaymentManager } from "./modules/createPaymentManager.js";
import { createTaskManager } from "./modules/createTaskManager.js";
import { createManagerTaskStore } from "./stores/managerTaskStore.js";

import { buildEddsa } from "@effectai/zkp";
import { createWorkerManager } from "./modules/createWorkerManager.js";
import { bigIntToBytes32, compressBabyJubJubPubKey } from "./utils.js";

import { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE } from "./consts.js";

import type { Request, Response, NextFunction } from "express";

import { createRequestHandler } from "@remix-run/express";

import {
  type Payment,
  type TaskRecord,
  HttpTransport,
  EffectProtocolMessage,
  Libp2pTransport,
  createTemplateStore,
  createPaymentStore,
  createEffectEntity,
} from "@effectai/protocol-core";

import path from "node:path";

export type ManagerEvents = {
  "task:created": (task: TaskRecord) => void;
  "task:accepted": CustomEvent<TaskRecord>;
  "task:rejected": (task: TaskRecord) => void;
  "task:submission": (task: TaskRecord) => void;
  "task:completed": CustomEvent<TaskRecord>;
  "payment:created": (payment: Payment) => void;
};

export type ManagerEntity = Awaited<ReturnType<typeof createManagerEntity>>;
export type CreateTaskManager = ReturnType<typeof createTaskManager>;
export type CreateWorkerManager = ReturnType<typeof createWorkerManager>;

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
  withAdmin: boolean;
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
  const logger = createLogger();

  const managerSettings: ManagerSettings = {
    port: settings.port ?? 19955,
    autoManage: settings.autoManage ?? true,
    listen: settings.listen ?? [`/ip4/0.0.0.0/tcp/${settings.port}/ws`],
    announce: settings.announce ?? [],
    paymentBatchSize: settings.paymentBatchSize ?? PAYMENT_BATCH_SIZE,
    requireAccessCodes: settings.requireAccessCodes ?? true,
    paymentAccount: settings.paymentAccount ?? null,
    withAdmin: settings.withAdmin ?? true,
  };

  if (!managerSettings.paymentAccount) {
    logger.warn("No payment account provided. Payments will not be processed.");
  }

  const eddsa = await buildEddsa();
  const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));

  const compressedPubKey = compressBabyJubJubPubKey(
    bigIntToBytes32(eddsa.F.toObject(pubKey[0])),
    bigIntToBytes32(eddsa.F.toObject(pubKey[1])),
  );

  const solanaPublicKey = new PublicKey(compressedPubKey);

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
    .onMessage("identifyRequest", async (_payload, { peerId }) => {
      //check if we've already onboarded this peer
      const worker = await workerManager.getWorker(peerId.toString());

      //check if this worker requires an access code.
      let requiresAccessCode = false;
      if (!worker && managerSettings.requireAccessCodes) {
        requiresAccessCode = true;
      }

      //check if this worker is in the queue
      const isConnected = workerManager.workerQueue.queue.includes(
        peerId.toString(),
      );

      const message: EffectProtocolMessage = {
        identifyResponse: {
          pubkey: solanaPublicKey.toBase58(),
          batchSize: 50,
          taskTimeout: 60000,
          version: "0.0.1",
          requiresAccessCode,
          isConnected,
        },
      };

      return message;
    })
    .onMessage(
      "requestToWork",
      async ({ recipient, nonce, accessCode }, { peerId }) => {
        await workerManager.connectWorker(
          peerId.toString(),
          recipient,
          nonce,
          accessCode,
        );
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

  let isStarted = false;
  let tearDownDash: () => Promise<void>;

  const setupManagerDashboard = async () => {
    const username = "admin";
    const password = "!effectai!#65";

    function basicAuth(req: Request, res: Response, next: NextFunction) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Basic ")) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Remix App"');
        return res.status(401).send("Authentication required.");
      }

      const base64Credentials = authHeader.split(" ")[1];
      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii",
      );
      const [inputUser, inputPass] = credentials.split(":");

      if (inputUser === username && inputPass === password) {
        return next();
      }

      res.setHeader("WWW-Authenticate", 'Basic realm="Remix App"');
      return res.status(401).send("Invalid credentials.");
    }

    async function setupRemix(app: any, context: ManagerContext) {
      const { createRequire } = await import("node:module");
      const require = createRequire(import.meta.url);

      const build = await import(
        require.resolve("../admin/build/server/index.js")
      );

      const remixHandler = createRequestHandler({
        build,
        mode: process.env.NODE_ENV,
        getLoadContext: () => context,
      });

      app.use((req: any, _res: any, next: any) => {
        (req as any).remixContext = context;
        next();
      });

      app.all("*", remixHandler);
    }

    //init express server
    const express = await import("express");
    const cors = await import("cors");

    const app = express.default();
    app.use(cors.default());
    app.use(basicAuth);

    app.use(
      express.default.static(path.join(__dirname, "../admin/build/client")),
    );

    app.get("/favicon.ico", (_req: any, res: any) => {
      res.status(204).end();
    });

    app.use(express.default.json());

    setupRemix(app, {
      manager: entity,
      taskManager,
      workerManager,
    });

    const server = app.listen(9000, () => {
      console.log("Manager Dashboard started on port 9000");
    });

    const tearDown = async () => {
      console.log("Tearing down manager dashboard");
      server.close();
    };

    return { tearDown };
  };

  const start = async () => {
    //start libp2p & http transports
    await entity.node.start();
    await entity.startHttp();

    //start manager dashboard
    if (managerSettings.withAdmin) {
      const { tearDown } = await setupManagerDashboard();
      tearDownDash = tearDown;
    }

    isStarted = true;
  };

  const stop = async () => {
    //stop libp2p & http transports
    await entity.node.stop();
    await entity.stopHttp();

    //stop express server
    if (tearDownDash) {
      tearDownDash();
    }

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
    workerManager.disconnectWorker(peerId.toString());
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
