import {
  type Datastore,
  webSockets,
  TypedEventEmitter,
  type PrivateKey,
  createLogger,
  PROTOCOL_VERSION,
  PROTOCOL_NAME,
} from "@effectai/protocol-core";

import bs58 from "bs58";

import { createPaymentManager } from "./modules/createPaymentManager.js";
import { createTaskManager } from "./modules/createTaskManager.js";
import { createManagerTaskStore } from "./stores/managerTaskStore.js";

import { buildEddsa } from "@effectai/zkp";
import { createWorkerManager } from "./modules/createWorkerManager.js";
import {
  bigIntToBytes32,
  compressBabyJubJubPubKey,
  proofResponseToGroth16Proof,
} from "./utils.js";

import { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE, TASK_ACCEPTANCE_TIME } from "./consts.js";

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
  getCycle: () => number;
  resume: () => void;
  pause: () => void;
  entity: ManagerEntity;
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
      name: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
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
  const startTime = Date.now();
  let cycle = 0;
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

      //check if this worker is in the queue
      const isConnected = workerManager.workerQueue.queue.includes(
        peerId.toString(),
      );

      if (!entity.node.peerId.publicKey) {
        throw new Error("Peer ID is not set");
      }

      const message: EffectProtocolMessage = {
        identifyResponse: {
          peer: entity.node.peerId.publicKey.raw,
          pubkey: solanaPublicKey.toBase58(),
          batchSize: PAYMENT_BATCH_SIZE,
          taskTimeout: TASK_ACCEPTANCE_TIME,
          version: PROTOCOL_VERSION,
          requiresRegistration: managerSettings.requireAccessCodes,
          isRegistered: !!worker,
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

        return {
          requestToWorkResponse: {
            timestamp: Math.floor(Date.now() / 1000),
            pubkey: solanaPublicKey.toBase58(),
            peer: entity.node.peerId.toString(),
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
      //FIX:: temp check
      const recipient = proofRequest.payments[0].recipient;
      if (!peerId.publicKey) {
        throw new Error("Peer ID public key is not set");
      }

      if (!Buffer.from(peerId.publicKey.raw).equals(bs58.decode(recipient))) {
        throw new Error("Forbidden");
      }

      return await paymentManager.processProofRequest({
        privateKey,
        payments: proofRequest.payments,
      });
    })
    .onMessage("bulkProofRequest", async (proofRequest, { peerId }) => {
      const worker = await workerManager.getWorker(peerId.toString());
      const recipient = worker?.state.recipient;

      if (!recipient) {
        throw new Error("Worker not found or recipient not set");
      }

      if (!proofRequest.proofs.every((p) => p.signals)) {
        throw new Error("All proofs must have signals for bulk payment");
      }

      return await paymentManager.bulkPaymentProofs({
        recipient: new PublicKey(recipient),
        privateKey,
        r8_x: eddsa.F.toObject(pubKey[0]),
        r8_y: eddsa.F.toObject(pubKey[1]),
        proofs: proofRequest.proofs.map((p) => ({
          proof: proofResponseToGroth16Proof(p),
          publicSignals: [
            p.signals!.minNonce.toString(),
            p.signals!.maxNonce.toString(),
            p.signals!.amount.toString(),
            p.signals!.recipient,
          ],
        })),
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
      peerId: entity.getPeerId().toString(),
      version: PROTOCOL_VERSION,
      isStarted,
      startTime,
      cycle,
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
  let isPaused = false;
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
      resume,
      pause,
      getCycle,
      entity,
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

  const pause = () => {
    logger.info("Pausing manager...");
    isPaused = true;
  };

  const resume = () => {
    logger.info("Resuming manager...");
    isPaused = false;
  };

  const getCycle = () => {
    return cycle;
  };

  const start = async () => {
    //start libp2p & http transports
    await entity.node.start();
    await entity.startHttp();

    console.log("Manager listening on:");
    entity.node.getMultiaddrs().forEach((addr) => {
      console.log(addr.toString());
    });

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

    while (!isPaused) {
      cycle++;
      await taskManager.manageTasks();
      await new Promise((res) => setTimeout(res, 1000));
    }
  }

  entity.node.addEventListener("peer:disconnect", (event) => {
    workerManager.disconnectWorker(event.detail.toString());
  });

  return {
    entity,
    events,

    taskManager,
    workerManager,

    start,
    stop,
    pause,
    resume,
    getCycle,
  };
};
