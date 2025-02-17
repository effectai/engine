import chalk from "chalk";
import { createManagerNode } from "./../dist/manager/manager.js";
import express from "express";

const manager = await createManagerNode([]);
const relayAddress = manager.getMultiaddrs()[0];
console.log("connecting on :", relayAddress.toString());

manager.services.peerQueue.addEventListener("peer:added", () => {
	console.log("Peer added to queue");
});

manager.addEventListener("peer:discovery", ({ detail }) => {
	console.log("Peer discovered");
});

//report some info every 10 seconds
setInterval(async () => {
	const queue = manager.services.peerQueue.getQueue();
	const peers = manager.getPeers();
	const tasks = await manager.services.taskStore.all();

	console.log(
		chalk.green(
			`Manager Info: ${peers.length} peers, ${queue.length} in queue, ${tasks.length} tasks`,
		),
	);
}, 10000);

const app = express();
app.use(express.json());

app.get("/tasks", async (req, res) => {
	const tasks = await manager.services.taskStore.all();
	res.json(tasks);
});

app.post("/task", async (req, res) => {
	const task = req.body;

	// check if worker has peers to send the task to
	if (manager.getPeers().length === 0) {
		return res.json({ status: "No peers available" });
	}

	const result = await manager.services.manager.acceptTask(task);

	res.json({ status: "Task received", task });
});

const PORT = 8888;
app.listen(PORT, () => {
	console.log(`HTTP server running on http://localhost:${PORT}`);
});
