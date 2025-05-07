import { readFileSync } from "node:fs";
import readline from "node:readline";
import { Command } from "commander";
import {
  generateKeyPairFromSeed,
  createManager,
  type ManagerTaskRecord,
} from "@effectai/protocol";
import { LevelDatastore } from "datastore-level";

export const runCommand = new Command();

let manager: Awaited<ReturnType<typeof createManager>> | null = null;
let logs: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const menu = `
[0] Start Manager
[1] Stop Manager
[2] Show Workers
[3] Show Active Tasks 
[4] Show Task Templates
[5] Ban Peers
[6] Generate access code
[7] Exit
`;

function renderScreen() {
  process.stdout.write("\x1Bc"); // Clear screen
  console.log("=== Logs ===");
  logs.slice(-10).forEach((log) => console.log(log)); // Show last 10 logs
  console.log("\n=== Menu ===");
  console.log(menu);
  process.stdout.write("> ");
}

function addLog(message: string) {
  logs.push(`[${new Date().toISOString()}] ${message}`);
  renderScreen();
}

async function startManager(
  privateKeyPath: string,
  paymentAccount: string,
  announceAddr?: string,
  port?: number,
) {
  if (manager) {
    addLog("Manager already started.");
    return;
  }

  try {
    const privateKey = readFileSync(privateKeyPath, "utf-8");
    const secretKey = Uint8Array.from(JSON.parse(privateKey));
    const keypair = await generateKeyPairFromSeed(
      "Ed25519",
      secretKey.slice(0, 32),
    );

    const datastore = new LevelDatastore("/tmp/manager");
    await datastore.open();

    manager = await createManager({
      privateKey: keypair,
      datastore,
      settings: {
        autoManage: true,
        announce: announceAddr ? [announceAddr] : [],
        port: port ? port : 11995,
        paymentBatchSize: 60,
        requireAccessCodes: true,
        paymentAccount,
      },
    });

    addLog("Manager started: " + manager.entity.getMultiAddress());

    if (manager.events) {
      manager.entity.node.addEventListener(
        "peer:connect",
        ({ detail }: any) => {
          addLog(`Peer connected: ${detail.toString()}`);
        },
      );
    }
  } catch (err: any) {
    addLog("Failed to start manager: " + err.message);
  }
}

async function stopManager() {
  if (!manager) {
    addLog("Manager not running.");
    return;
  }

  await manager.stop();

  manager = null;
  addLog("Manager stopped.");
}

async function showConnectedPeers() {
  if (!manager) {
    addLog("Manager not running.");
    return;
  }

  const peers = manager.workerManager.workerQueue.getQueue();
  addLog("Connected Peers: " + peers.join(", "));
}

async function showActiveTasks() {
  if (!manager) {
    addLog("Manager not running.");
    return;
  }
  const tasks = await manager.taskManager.getActiveTasks();
  addLog(
    "Active Tasks: " +
      tasks.map((t: ManagerTaskRecord) => t.state.id).join("; "),
  );
}

async function handleInput(
  input: string,
  options: {
    paymentAccount: string;
    privateKey: string;
    announce?: string;
    port?: number;
  },
) {
  switch (input.trim()) {
    case "0":
      await startManager(
        options.privateKey,
        options.paymentAccount,
        options.announce,
        options.port,
      );
      break;
    case "1":
      await stopManager();
      break;
    case "2":
      await showConnectedPeers();
      break;
    case "3":
      await showActiveTasks();
      break;
    case "4": {
      // await showTemplates()
      break;
    }
    case "5": {
      //ban peers
      break;
    }
    case "6": {
      if (!manager) {
        addLog("Manager not running.");
        return;
      }
      const accessCode = await manager.workerManager.generateAccessCode();
      addLog(`Generated access code: ${accessCode}`);
      break;
    }
    case "7": {
      addLog("Exiting...");
      rl.close();
      process.exit(0);
      break;
    }
    default:
      addLog("Invalid option. Try again.");
  }
}

async function startPrompt(options: {
  paymentAccount: string;
  privateKey: string;
  announce?: string;
}) {
  renderScreen();
  rl.on("line", (input) => handleInput(input, options));
}

runCommand
  .name("run")
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
      addLog("Manager CLI started");
      await startPrompt(options);
    } catch (e) {
      console.error("Error:", e);
      process.exit(1);
    }
  });

// program.parseAsync().catch(console.error);
