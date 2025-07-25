import {
  type Datastore,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  type PrivateKey,
  TypedEventEmitter,
  webSockets,
} from "@effectai/protocol-core";

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
  };

  if (!managerSettings.paymentAccount) {
    logger.log.warn(
      "No payment account provided. Payments will not be processed.",
    );
  }

  const eddsa = await buildEddsa();
  const pubKey = eddsa.prv2pub(privateKey.raw.slice(0, 32));
  const compressedPubKey = eddsa.babyJub.packPoint(pubKey);

  //bs58 encode the compressed public key
  const solanaPublicKey = new PublicKey(compressedPubKey);
  logger.log.info(`Using Solana public key: ${solanaPublicKey.toBase58()}`);

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
    .onMessage("proofRequest", async (proofRequest) => {
      return await paymentManager.processProofRequest({
        request: proofRequest,
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

      logger.context.run({ peerId: peerId.toString() }, async () => {
        return await paymentManager.bulkPaymentProofs({
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
    workerManager.disconnectWorker(event.detail.toString());
  });

  // start the manager
  await start();
  logger.log.info(
    `Manager started on port ${managerSettings.port} with settings:`,
    managerSettings,
  );

  return {
    entity,
    events,

    taskManager,
    workerManager,

    stop,
  };
};
