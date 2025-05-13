import { Command } from "commander";
import { LevelDatastore } from "datastore-level";
import { readFileSync } from "node:fs";
import { createManager, generateKeyPairFromSeed } from "@effectai/protocol";

export const startCommand = new Command();

startCommand
  .name("start")
  .option("--payment-account <address>", "Payment account address")
  .option("--no-payments", "Disable payments")
  .requiredOption(
    "-k, --private-key <path>",
    "Path to manager private key file",
  )
  .option("--announce <multiaddr>", "Libp2p announce address")
  .option("--port <port>", "Libp2p port", "11995")
  .action(async (options) => {
    try {
      if (options.payments !== false && !options.paymentAccount) {
        console.error(
          "Error: --payment-account is required unless --no-payments is specified",
        );
        process.exit(1);
      }

      try {
        const privateKey = readFileSync(options.privateKey, "utf-8");
        const secretKey = Uint8Array.from(JSON.parse(privateKey));
        const keypair = await generateKeyPairFromSeed(
          "Ed25519",
          secretKey.slice(0, 32),
        );

        const datastore = new LevelDatastore("/tmp/manager");
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
          },
        });
      } catch (err: any) {
        console.error("error starting manager", err.message);
      }
    } catch (e) {
      console.error("Error:", e);
      process.exit(1);
    }
  });

// program.parseAsync().catch(console.error);
