import { Command } from "commander";
import { readFileSync } from "node:fs";
import { generateKeyPairFromSeed, createWorkerEntity } from "@effectai/protocol";
import { multiaddr } from "@multiformats/multiaddr";

export const storageCommand = new Command();

storageCommand
  .name("storage")
  .description("Content-addressable storage operations over P2P");

storageCommand
  .command("store")
  .description("Store data on a manager node")
  .requiredOption("-d, --data <base64>", "Base64-encoded data to store")
  .action(async (options, cmd) => {
    const opts = cmd.optsWithGlobals();
    const secretKey = loadKeypair(opts.keypair);
    const keypair = await generateKeyPairFromSeed("Ed25519", secretKey.slice(0, 32));

    const w = await createWorkerEntity({ datastore: undefined, privateKey: keypair });
    await w.node.start();

    try {
      const bytes = Uint8Array.from(Buffer.from(options.data, "base64"));
      const [response, error] = await w.sendMessage(
        multiaddr(opts.manager) as any,
        { storeObject: { data: bytes } },
      );

      if (error) {
        console.error("❌ Error storing object:", error.message);
        process.exit(1);
      }

      const res = response as any;
      if (res?.hash) {
        console.log(`✅ Object stored successfully`);
        console.log(`   Hash: ${res.hash}`);
      }
    } catch (e) {
      console.error("❌ Error:", e instanceof Error ? e.message : e);
      process.exit(1);
    } finally {
      await w.node.stop();
    }
  });

storageCommand
  .command("get")
  .description("Retrieve an object by its content hash")
  .requiredOption("-c, --cid <hash>", "Content hash (SHA-256 hex)")
  .action(async (options, cmd) => {
    const opts = cmd.optsWithGlobals();
    const secretKey = loadKeypair(opts.keypair);
    const keypair = await generateKeyPairFromSeed("Ed25519", secretKey.slice(0, 32));

    const w = await createWorkerEntity({ datastore: undefined, privateKey: keypair });
    await w.node.start();

    try {
      const [response, error] = await w.sendMessage(
        multiaddr(opts.manager) as any,
        { getObject: { hash: options.cid } },
      );

      if (error) {
        console.error("❌ Error getting object:", error.message);
        process.exit(1);
      }

      const res = response as any;
      if (res?.data) {
        const data = res.data;
        const base64 = Buffer.from(data).toString("base64");
        console.log(`✅ Object retrieved`);
        console.log(`   Owner: ${res.owner}`);
        console.log(`   Data (base64): ${base64}`);
      }
    } catch (e) {
      console.error("❌ Error:", e instanceof Error ? e.message : e);
      process.exit(1);
    } finally {
      await w.node.stop();
    }
  });

storageCommand
  .command("delete")
  .description("Delete an object by its content hash (must be owner)")
  .requiredOption("-c, --cid <hash>", "Content hash (SHA-256 hex)")
  .action(async (options, cmd) => {
    const opts = cmd.optsWithGlobals();
    const secretKey = loadKeypair(opts.keypair);
    const keypair = await generateKeyPairFromSeed("Ed25519", secretKey.slice(0, 32));

    const w = await createWorkerEntity({ datastore: undefined, privateKey: keypair });
    await w.node.start();

    try {
      const [response, error] = await w.sendMessage(
        multiaddr(opts.manager) as any,
        { deleteObject: { hash: options.cid } },
      );

      if (error) {
        console.error("❌ Error deleting object:", error.message);
        process.exit(1);
      }

      console.log(`✅ Object deleted successfully`);
    } catch (e) {
      console.error("❌ Error:", e instanceof Error ? e.message : e);
      process.exit(1);
    } finally {
      await w.node.stop();
    }
  });

function loadKeypair(keypairPath: string): Uint8Array {
  if (!keypairPath) {
    console.error("error: required option --keypair not specified");
    process.exit(1);
  }
  const privateKey = readFileSync(keypairPath, "utf-8");
  const parsed = JSON.parse(privateKey);
  return Uint8Array.from(Array.isArray(parsed) ? parsed : []);
}