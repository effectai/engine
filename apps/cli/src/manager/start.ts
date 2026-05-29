import { Command } from "commander";
import { LevelDatastore } from "datastore-level";
import { readFileSync } from "node:fs";
import { createManager, generateKeyPairFromSeed } from "@effectai/protocol";

export const startCommand = new Command();

startCommand
  .name("start")
  .option("--payment-account <address>", "Payment account address")
  .option("--announce <multiaddr>", "Libp2p announce address")
  .option("--maintenance", "Run in maintenance mode", false)
  .option("--port <port>", "Libp2p port", "11995")
  .option("--data <path>", "Path to datastore", "./data/manager")
  .action(async (options, cmd) => {
    try {
      const opts = cmd.optsWithGlobals();
      const privateKey = readFileSync(opts.keypair, "utf-8");
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
