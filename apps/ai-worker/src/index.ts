import { readFileSync } from "fs";
import { createWorker, Task, type WorkerEntity } from "@effectai/protocol";
import {
  generateKeyPairFromSeed,
  privateKeyFromRaw,
} from "@libp2p/crypto/keys";
import type { PrivateKey, Libp2p, Connection } from "@libp2p/interface";
import { randomBytes } from "node:crypto";
import { LevelDatastore } from "datastore-level";
import { multiaddr } from "@multiformats/multiaddr";
import { Keypair } from "@solana/web3.js";
import * as Worker from "./worker.js";
import { state, type State } from "./state.js";

const storePath = "/tmp/ai-worker";
const p2pBoot =
      "/ip4/127.0.0.1/tcp/11995/ws/p2p/12D3KooWAQH4SQHt12N2eGnAUR4iixS8TAfKxRqfd17sDurZ1v5R"
  // "/dns4/mgr1.alpha.effect.net/tcp/443/wss/p2p/12D3KooWAawwqMDxDSkZhNTDes5VH6yPQJ6G5ToePhxezJyr5SpC";

const seed = Uint8Array.from(
  JSON.parse(
    readFileSync("tst8sA9paoprGP987QKSuX9VoHY22AXtB8b3bMTckf4.json", "utf-8"),
  ),
);

const loadKey = (priv: Uint8Array): PrivateKey => privateKeyFromRaw(priv);
const generateKey = (): PrivateKey => loadKey(randomBytes(64));

const workerKp = loadKey(seed);
const workerPubHex = Buffer.from(workerKp.publicKey.raw).toString("hex");

console.log(`Loaded key 0x${workerPubHex}`);
console.log("Connecting to manager...", p2pBoot);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// start
console.log("Starting Worker! Wroom");

console.log("Started");

const mainLoop = async () => {
  while (!state.done) {
    switch (state.current) {
      case "init_p2p":
	console.log("Initializing p2p");

	state.privateKey = workerKp;
	state.datastore = new LevelDatastore(storePath);
	await (state.datastore as LevelDatastore).open();

	await Worker.create();

	console.log("Creating worker");
	await state.worker!.start();

	console.log("Starting worker with code");
	const workerRecipient = Keypair.fromSecretKey(seed, {
	  skipValidation: true,
	});
	await state.worker!.connect(
	  multiaddr(p2pBoot),
	  {recipient: workerRecipient.publicKey.toBase58(),
	    nonce: 1n,
	    accessCode: "7q4zp7yf"}
	);
	console.log("Connected to network");

	state.current = "init_llm";

	break;

      case "init_llm":
	console.log("Initializing LLM. Skip for now");
	state.current = "running";
	break;

      case "running":
	await delay(5000);
	break;

      default:
	console.log(`Unknown State ${state.current}`);
	state.done = true;
    }

    if (state.current === "running") {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
};

try {
  await mainLoop();
} catch (e) {
  console.log(`Main Loop error ${e}`);
}

// cleanup
console.log("Stopping Worker...");
if (state.worker) await state.worker!.stop();
console.log("Done");
