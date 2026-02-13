import { multiaddr } from "@multiformats/multiaddr";
import { Keypair } from "@solana/web3.js";
import type { PrivateKey } from "@libp2p/interface";
import { privateKeyFromRaw } from "@libp2p/crypto/keys";
import { LevelDatastore } from "datastore-level";
import { loadWorkerConfig } from "./config.js";
import { type State, state } from "./state.js";
import * as Worker from "./worker.js";

const storePath = "/tmp/ai-worker";
const p2pBoot =
      "/ip4/127.0.0.1/tcp/11995/ws/p2p/12D3KooWAQH4SQHt12N2eGnAUR4iixS8TAfKxRqfd17sDurZ1v5R"
  // "/dns4/mgr1.alpha.effect.net/tcp/443/wss/p2p/12D3KooWAawwqMDxDSkZhNTDes5VH6yPQJ6G5ToePhxezJyr5SpC";

const loadKey = (priv: Uint8Array): PrivateKey => privateKeyFromRaw(priv);

const { capability, privateKey: privBytes, accessCode } = loadWorkerConfig();
const workerKp = loadKey(privBytes);
const workerPubHex = Buffer.from(workerKp.publicKey.raw).toString("hex");
const logger = state.logger;

logger.info("Loaded key", { publicKey: `0x${workerPubHex}` });
logger.info("Connecting to manager", { p2pBoot });

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// start
logger.info("Starting worker");

const mainLoop = async () => {
  while (!state.done) {
    switch (state.current) {
      case "init_p2p": {
	logger.info("Initializing p2p");

	state.privateKey = workerKp;
	state.datastore = new LevelDatastore(storePath);
	await (state.datastore as LevelDatastore).open();

	await Worker.create();

	logger.info("Creating worker");
	await state.worker?.start();

	logger.info("Starting worker with code");
	const workerRecipient = Keypair.fromSecretKey(privBytes, {
	  skipValidation: true,
	});
	try {
	  await state.worker?.connect(
	    multiaddr(p2pBoot),
	    {
	      recipient: workerRecipient.publicKey.toBase58(),
	      nonce: 1n,
	      accessCode,
	      capabilities: [capability],
	    }
	  );
	} catch (e: unknown) {
	  if (e instanceof Error && e.message.toLowerCase().includes("access code")) {
	    logger.error("Access code rejected. Request a new one from https://worker.effect.ai/ and restart with --access-code <code>.");
	    process.exit(1);
	  }
	  throw e;
	}
	logger.info("Connected to network");

	state.current = "init_llm";

	break;
      }

      case "init_llm":
	logger.info("Initializing LLM. Skip for now");
	state.current = "running";
	break;

      case "running":
	await delay(5000);
	break;

      default:
	logger.warn(`Unknown State ${state.current}`);
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
  logger.error("Main loop error", { error: e });
}

// cleanup
logger.info("Stopping worker");
if (state.worker) await state.worker!.stop();
logger.info("Done");
