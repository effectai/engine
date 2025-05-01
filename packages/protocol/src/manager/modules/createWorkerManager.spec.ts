import { PeerId } from "@libp2p/interface";
import { Keypair, PublicKey } from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentManager } from "./createPaymentManager.js";
import { createWorkerManager } from "./createWorkerManager.js";

import { promises } from "node:fs";
import { createDataStore } from "../../../tests/utils.js";
import { Datastore, Key } from "interface-datastore";

describe("createWorkerManager", () => {
  let datastore: Datastore;
  let mockPeerId = "worker-test-123";
  let mockRecipient = new Keypair().publicKey;

  beforeEach(async () => {
    await promises.rm("/tmp/worker-manager-test", {
      recursive: true,
      force: true,
    });

    datastore = await createDataStore("/tmp/worker-manager-test");
  });

  afterEach(async () => {
    await datastore.close();
  });

  describe("Worker Manager: Access Code flow", () => {
    let workerManager: ReturnType<typeof createWorkerManager>;

    beforeEach(() => {
      workerManager = createWorkerManager({
        datastore,
        managerSettings: {
          requireAccessCodes: true,
        },
      });
    });

    it("should be able to signup a new worker with access code", async () => {
      const code = await workerManager.generateAccessCode();

      //connect a worker
      await workerManager.connectWorker(
        mockPeerId,
        mockRecipient.toString(),
        1n,
        code,
      );

      //expect to have a peer in the peerQueue
      expect(workerManager.workerQueue.queue.length === 1);

      // expect worker to have been succesfully created
      const worker = await workerManager.getWorker(mockPeerId);

      expect(worker).toBeDefined();

      //expect access code to be redeemed
      const result = await datastore.get(new Key(`access-codes/${code}`));
      const accessCode = JSON.parse(result.toString());

      expect(accessCode.redeemedBy).to.equal(mockPeerId);
    });

    it("should throw an InvalidAccessCode error if given a wrong access code", () => {});
  });

  describe("Worker Manager: Worker flow", () => {
    let workerManager: ReturnType<typeof createWorkerManager>;

    beforeEach(() => {
      workerManager = createWorkerManager({
        datastore,
        managerSettings: {
          requireAccessCodes: false,
        },
      });
    });

    it("should select a worker", async () => {
      const workerPeers = ["worker1", "worker2", "worker3"];

      //connect 3 workers.
      for (const worker of workerPeers) {
        await workerManager.connectWorker(worker, mockRecipient.toString(), 1n);
      }

      //expect 3 workers in store
      expect(workerManager.workerQueue.queue).toHaveLength(3);

      let selectedWorker: string | null = null;
      //expect to have a peer in the peerQueue
      selectedWorker = await workerManager.selectWorker();
      expect(selectedWorker).toBe("worker1");

      //make worker 2 busy
      await workerManager.updateWorkerState("worker2", {
        totalTasks: 3,
      });

      //expect worker 2 to be busy
      selectedWorker = await workerManager.selectWorker();
      expect(selectedWorker).toBe("worker3");

      //expect to have 3 workers in the queue
      expect(workerManager.workerQueue.queue).toHaveLength(3);
    });
  });
});
