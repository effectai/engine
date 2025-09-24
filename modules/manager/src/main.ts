import {
  type Datastore,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  type PrivateKey,
  TypedEventEmitter,
  webSockets,
} from "@effectai/protocol-core";

import type { Request, Response } from "express";

import { createPaymentManager } from "./modules/createPaymentManager.js";
import { createTaskManager } from "./modules/createTaskManager.js";
import { createManagerTaskStore } from "./stores/managerTaskStore.js";

import { buildEddsa } from "@effectai/payment";
import { createWorkerManager } from "./modules/createWorkerManager.js";
import { proofResponseToGroth16Proof } from "./utils.js";

import { PublicKey } from "@solana/web3.js";
import { PAYMENT_BATCH_SIZE, TASK_ACCEPTANCE_TIME } from "./consts.js";

import {
  HttpTransport,
  type HttpHandler,
  Libp2pTransport,
  type TaskRecord,
  createEffectEntity,
  createPaymentStore,
  createTemplateStore,
} from "@effectai/protocol-core";
import { EffectProtocolMessage, type Payment } from "@effectai/protobufs";

import { AsyncLocalStorage } from "node:async_hooks";
import { createLogger } from "./logging.js";
import { setupManagerDashboard } from "./modules/createAdminDashboard.js";
import { createManagerControls } from "./modules/createManagerControls.js";

export type ManagerEvents = {
  "task:created": (task: TaskRecord) => void;
  "task:accepted": CustomEvent<TaskRecord>;
  "task:rejected": (task: TaskRecord) => void;
  "task:submission": (task: TaskRecord) => void;
  "task:completed": CustomEvent<TaskRecord>;

  "payment:created": (payment: Payment) => void;

  "manager:start": CustomEvent<void>;
  "manager:stop": CustomEvent<void>;
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
  maintenanceMode: boolean;
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

  const context = new AsyncLocalStorage<{
    peerId: string;
  }>();

  const logger = createLogger("manager", context);

  const managerSettings: ManagerSettings = {
    port: settings.port ?? 19955,
    autoManage: settings.autoManage ?? true,
    listen: settings.listen ?? [`/ip4/0.0.0.0/tcp/${settings.port}/ws`],
    announce: settings.announce ?? [],
    paymentBatchSize: settings.paymentBatchSize ?? PAYMENT_BATCH_SIZE,
    requireAccessCodes: settings.requireAccessCodes ?? true,
    paymentAccount: settings.paymentAccount ?? null,
    withAdmin: settings.withAdmin ?? true,
    maintenanceMode: settings.maintenanceMode ?? false,
  };

  if (!managerSettings.paymentAccount) {
    logger.log.warn(
      "No payment account provided. Payments will not be processed.",
    );
  }

  if (managerSettings.maintenanceMode) {
    logger.log.warn(
      "Manager is running in maintenance mode. Only administrators will be able to connect.",
    );
  }

  const eddsa = await buildEddsa();
  const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));
  const compressedPubKey = eddsa.babyJub.packPoint(pubKey);

  //bs58 encode the compressed public key
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
    logger,
    workerManager,
    privateKey,
    publicKey: solanaPublicKey.toString(),
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
          isRegistered: !!worker && !!worker.state.accessCodeRedeemed,
          isConnected,
        },
      };

      return message;
    })
    .onMessage(
      "requestToWork",
      async ({ recipient, nonce, accessCode, capabilities }, { peerId }) => {
        await workerManager.connectWorker(
          peerId.toString(),
          recipient,
          nonce,
          capabilities.split(","),
          accessCode,
        );

        logger.log.info(
          { peerId: peerId.toString(), recipient, nonce, accessCode },
          `Worker connected with Capabilities: ${capabilities}`,
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
    .onMessage("proofRequest", async (proofRequest) => {
      return await paymentManager.processProofRequest({
        request: proofRequest,
      });
    })
    .onMessage("bulkProofRequest", async (proofRequest, { peerId }) => {
      if (!proofRequest.proofs.every((p) => p.signals)) {
        throw new Error("All proofs must have signals for bulk payment");
      }

      logger.context.enterWith({ peerId: peerId.toString() });

      return await paymentManager.bulkPaymentProofs({
        paymentAccount: proofRequest.paymentAccount,
        recipient: proofRequest.recipient,
        proofs: proofRequest.proofs.map((p) => {
          if (!p.signals) {
            throw new Error("Missing publicSignals in proof response");
          }

          return {
            proof: proofResponseToGroth16Proof(p),
            publicSignals: p.signals,
          };
        }),
      });
    })
    .onMessage("payoutRequest", async (_payoutRequest, { peerId }) => {
      const payment = await paymentManager.processPayoutRequest({
        peerId,
      });

      logger.log.info(
        {
          peerId: peerId.toString(),
          paymentNonce: payment.nonce,
          amount: payment.amount,
        },
        "Payout request processed",
      );

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

  /**
   * Returns an ordered list of task results. Filters out only the
   * first submission event, and adds a `taskId` property to it. Task
   * IDs to fetch are supplied as a semicolon separated path
   * parameter, like `?ids=1;2;3`
   *
   * If the task could not be found, the result array contains an
   * object with an `error` key at the corresponding list index.
   */
  entity.get("/task-results", (async (req: Request, res: Response) => {
    const { ids } = req.query;

    if (!ids) return res.status(404).json("not found");

    const taskIds = (ids as string).split(";");

    const tasks = taskIds.map(async (taskId: string) => {
      return await taskManager
        .getTask({
          taskId,
          index: "completed",
        })
        .then(
          (a) =>
            a.events
              .filter((e: any) => e.type === "submission")
              .map((e: any) => ({ ...e, taskId }))[0],
        )
        .catch((_e) => ({ taskId, error: "NOT FOUND" }));
    });

    const all = await Promise.all(tasks);
    res.json(all);
  }) as HttpHandler);

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
      publicKey: solanaPublicKey.toBase58(),
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

  const { isStarted, pause, resume, getCycle, start, stop, cycle } =
    createManagerControls({
      events,
      entity,
      logger,
      taskManager,
      managerSettings,
    });

  const { tearDown } = await setupManagerDashboard({
    context: {
      taskManager,
      entity,
      workerManager,
      getCycle,
      pause,
      resume,
    },
  });

  events.addEventListener("manager:stop", async () => {
    await tearDown();
  });

  entity.node.addEventListener("peer:disconnect", (event) => {
    logger.log.info({ peerId: event.detail.toString() }, "Worker disconnected");
    workerManager.disconnectWorker(event.detail.toString());
  });

  // start the manager
  await start();

  logger.log.info(
    managerSettings,
    `Manager started on port ${managerSettings.port}`,
  );

  return {
    entity,
    events,

    taskManager,
    workerManager,

    stop,
  };
};
