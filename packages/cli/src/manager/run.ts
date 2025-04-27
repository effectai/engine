import { readFileSync } from "fs";
import readline from "readline";
import { Command } from "commander";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { LevelDatastore } from "datastore-level";
import { createManager } from "@effectai/protocol";

const program = new Command();

let manager: Awaited<ReturnType<typeof createManager>> | null = null;
let logs: string[] = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const menu = `
[0] Start Manager
[1] Stop Manager
[2] Show Peers
[3] Show Active Tasks
[4] Show Logs
[5] Show Task Templates
[6] Show Task Results
[7] Ban worker
[8] Exit
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

async function startManager(privateKeyPath: string, announceAddr?: string) {
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
      autoManage: true,
      announce: announceAddr ? [announceAddr] : [],
      port: 11955,
    });

    addLog("Manager started: " + manager.entity.getMultiAddress());

    if (manager.events) {
      manager.entity.node.addEventListener("peer:connect", ({ detail }) => {
        addLog(`Peer connected: ${detail.toString()}`);
      });
    }
  } catch (err) {
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

async function showPeers() {
  if (!manager) {
    addLog("Manager not running.");
    return;
  }
  const peers = await manager.getPeers();
  addLog("Connected Peers: " + peers.join(", "));
}

async function showActiveTasks() {
  if (!manager) {
    addLog("Manager not running.");
    return;
  }
  const tasks = await manager.getActiveTasks();
  addLog(
    "Active Tasks: " + tasks.map((t: any) => JSON.stringify(t)).join("; "),
  );
}

async function handleInput(
  input: string,
  options: { privateKey: string; announce?: string },
) {
  switch (input.trim()) {
    case "0":
      await startManager(options.privateKey, options.announce);
      break;
    case "1":
      await stopManager();
      break;
    case "2":
      await showPeers();
      break;
    case "3":
      await showActiveTasks();
      break;
    case "4":
      addLog("Exiting...");
      rl.close();
      process.exit(0);
    default:
      addLog("Invalid option. Try again.");
  }
}

async function startPrompt(options: { privateKey: string; announce?: string }) {
  renderScreen();
  rl.on("line", (input) => handleInput(input, options));
}

program
  .command("manager")
  .description("Manager operations")
  .command("run")
  .requiredOption(
    "-k, --private-key <path>",
    "Path to manager private key file",
  )
  .option("--announce <multiaddr>", "Libp2p announce address")
  .action(async (options) => {
    try {
      addLog("Manager CLI started");
      await startPrompt(options);
    } catch (e) {
      console.error("Error:", e);
      process.exit(1);
    }
  });

program.parseAsync().catch(console.error);
