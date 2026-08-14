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
  .option("-t, --type <number>", "Object type: 0=raw (default), 1=linked-list", "0")
  .option("-n, --next <hash>", "Hash of the next node in a linked list")
  .action(async (options, cmd) => {
    const opts = cmd.optsWithGlobals();
    const secretKey = loadKeypair(opts.keypair);
    const keypair = await generateKeyPairFromSeed("Ed25519", secretKey.slice(0, 32));

    const w = await createWorkerEntity({ datastore: undefined, privateKey: keypair });
    await w.node.start();

    try {
      const bytes = Uint8Array.from(Buffer.from(options.data, "base64"));
      const msg: any = { storeObject: { data: bytes } };
      msg.storeObject.type = parseInt(options.type, 10);
      if (options.next) {
        msg.storeObject.next = options.next;
      }

      const [response, error] = await w.sendMessage(
        multiaddr(opts.manager) as any,
        msg,
      );

      if (error) {
        console.error("Error storing object:", error.message);
        process.exit(1);
      }

      const res = response as any;
      if (res?.hash) {
        console.log(`Object stored successfully`);
        console.log(`  Hash: ${res.hash}`);
      }
    } catch (e) {
      console.error("Error:", e instanceof Error ? e.message : e);
      process.exit(1);
    } finally {
      await w.node.stop();
    }
  });

storageCommand
  .command("get")
  .description("Retrieve an object by its content hash")
  .requiredOption("-c, --cid <hash>", "Content hash (SHA-256 hex)")
  .option("-l, --limit <number>", "Max items to follow for linked lists", "10")
  .action(async (options, cmd) => {
    const opts = cmd.optsWithGlobals();
    const secretKey = loadKeypair(opts.keypair);
    const keypair = await generateKeyPairFromSeed("Ed25519", secretKey.slice(0, 32));

    const w = await createWorkerEntity({ datastore: undefined, privateKey: keypair });
    await w.node.start();

    try {
      const [response, error] = await w.sendMessage(
        multiaddr(opts.manager) as any,
        { getObject: { hash: options.cid, limit: parseInt(options.limit, 10) } },
      );

      if (error) {
        console.error("Error getting object:", error.message);
        process.exit(1);
      }

      const res = response as any;
      if (res?.items && res.items.length > 0) {
        console.log(`Object retrieved (${res.items.length} item(s))`);
        for (const item of res.items) {
          const dataBase64 = Buffer.from(item.data).toString("base64");
          console.log(`  Item[${item.hash.slice(0, 12)}..]`);
          console.log(`    Type:  ${item.type === 1 ? "linked-list" : "raw"}`);
          const ownerHex = Buffer.from(item.owner).toString("hex").slice(0, 16);
          console.log(`    Owner: ${ownerHex}..`);
          if (item.next) {
            console.log(`    Next:  ${item.next.slice(0, 16)}..`);
          }
          console.log(`    Data:  ${dataBase64}`);
        }
      }
    } catch (e) {
      console.error("Error:", e instanceof Error ? e.message : e);
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
        console.error("Error deleting object:", error.message);
        process.exit(1);
      }

      console.log(`Object deleted successfully`);
    } catch (e) {
      console.error("Error:", e instanceof Error ? e.message : e);
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