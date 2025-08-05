import { Command } from "commander";
import { LevelDatastore } from "datastore-level";
import { readFileSync } from "node:fs";
import { createManager, generateKeyPairFromSeed } from "@effectai/protocol";

export const startCommand = new Command();

startCommand
  .name("start")
  .requiredOption("--payment-account <address>", "Payment account address")
  .requiredOption(
    "-k, --private-key <path>",
    "Path to manager private key file",
  )
  .option("--announce <multiaddr>", "Libp2p announce address")
  .option("--maintenance", "Run in maintenance mode", false)
  .option("--port <port>", "Libp2p port", "11995")
  .option("--data <path>", "Path to datastore", "./data/manager")
  .action(async (options) => {
    try {
      const privateKey = readFileSync(options.privateKey, "utf-8");
      const secretKey = Uint8Array.from(JSON.parse(privateKey));
      const keypair = await generateKeyPairFromSeed(
        "Ed25519",
        secretKey.slice(0, 32),
      );

      const datastore = new LevelDatastore(options.data);
      await datastore.open();

      await createManager({
        privateKey: keypair,
        datastore,
        settings: {
          autoManage: true,
          announce: options.announce ? [options.announce] : [],
          port: options.port ? options.port : 11995,
          paymentBatchSize: 60,
          requireAccessCodes: true,
          paymentAccount: options.paymentAccount,
          maintenanceMode: options.maintenance,
        },
      });
    } catch (e) {
      console.error("Error:", e);
      process.exit(1);
    }
  });

// program.parseAsync().catch(console.error);
