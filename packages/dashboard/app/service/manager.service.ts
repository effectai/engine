// app/services/manager.server.ts
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { randomBytes } from "crypto";
import { LevelDatastore } from "datastore-level";
import { createManager, createWorker } from "@effectai/protocol";

let managerInstance: Awaited<ReturnType<typeof createManager>> | null = null;
let workerInstance: Awaited<ReturnType<typeof createWorker>> | null = null;

export async function getManager() {
  if (!managerInstance) {
    const mgrKeypair = await generateKeyPairFromSeed(
      "Ed25519",
      randomBytes(32),
    );
    const datastore = new LevelDatastore(
      `/tmp/manager-remix/singleton-instance`,
    );
    await datastore.open();

    managerInstance = await createManager({
      privateKey: mgrKeypair,
      datastore,
      settings: {
        autoManage: true,
        paymentBatchSize: 60,
        requireAccessCodes: false,
      },
    });

    const multiaddress = managerInstance.entity.getMultiAddress()?.[0];
    if (!multiaddress) {
      throw new Error("No multiaddress found");
    }
    console.log(multiaddress);

    // createa a worker
    const workerKeypair = await generateKeyPairFromSeed(
      "Ed25519",
      randomBytes(32),
    );
    const datastoreWorker = new LevelDatastore(`/tmp/worker-remix/s-i-worker`);
    await datastoreWorker.open();
    workerInstance = await createWorker({
      privateKey: workerKeypair,
      datastore: datastoreWorker,
      autoExpire: true,
    });
    await workerInstance.start();
    workerInstance.connect(multiaddress, "test-peer", 1n);

    process.on("beforeExit", async () => {
      await managerInstance?.stop();
      await workerInstance?.stop();
    });
  }
  return managerInstance;
}

export async function stopManager() {
  if (managerInstance) {
    await managerInstance.stop();
    managerInstance = null;
  }
}
