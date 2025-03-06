import chalk from "chalk";
import express from "express";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { createManagerNode } from "../dist/manager.js";

const seed = Uint8Array.from([
	0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16,
	0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23,
	0x24, 0x25, 0x26, 0x27, 0x28, 0x29,
]);

const key = await generateKeyPairFromSeed("Ed25519", Buffer.from(seed, "hex"));
const manager = await createManagerNode([], key);
const relayAddress = manager.getMultiaddrs()[0];
console.log("connecting on :", relayAddress.toString());

//report some info every 10 seconds
setInterval(async () => {
	const queue = manager.services.manager.getQueue();
	const peers = manager.getPeers();
	const tasks = await manager.services.manager.getTasks();

	console.log(
		chalk.green(
			`Manager Info: ${peers.length} peers, ${queue.length} in queue, ${tasks.length} tasks`,
		),
	);
}, 10000);

const app = express();
app.use(express.json());

app.get("/tasks", async (req, res) => {
	const tasks = await manager.services.manager.getTasks();
	res.json(tasks);
});

app.post("/task", async (req, res) => {
	const task = req.body;

	// check if worker has peers to send the task to
	if (manager.getPeers().length === 0) {
		return res.json({ status: "No peers available" });
	}

	await manager.services.manager.acceptTask(task);

	res.json({ status: "Task received", task });
});

const PORT = 8888;
app.listen(PORT, () => {
	console.log(`HTTP server running on http://localhost:${PORT}`);
});
