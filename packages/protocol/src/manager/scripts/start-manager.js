import { createManager } from "./../../../dist/manager/main.js";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { randomBytes } from "node:crypto";
import { LevelDatastore } from "datastore-level";
import express from "express";

const managerPrivateKey = await generateKeyPairFromSeed(
  "Ed25519",
  randomBytes(32),
);

const datastore = new LevelDatastore("/tmp/manager");
await datastore.open();

const manager = await createManager({
  privateKey: managerPrivateKey,
  datastore,
});

//start managing on interval
setInterval(async () => {
  await manager.taskManager.manageTasks();
}, 5000);

const app = express();
app.use(express.json());

app.get("/tasks", async (req, res) => {
  //TODO::
});

app.post("/task", async (req, res) => {
  const task = req.body;
  //save task in manager store
  try {
    await manager.taskManager.createTask({
      task,
      providerPeerIdString: manager.entity.getPeerId(),
    });
    res.json({ status: "Task received", task });
  } catch (e) {
    console.error("Error creating task", e);
    res.status(500).json({
      status: "Error creating task",
      error: e.message,
    });
  }
});

const PORT = 8888;

app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

console.log(
  `manager running on the following multiaddresses: \n ${manager.entity
    .getMultiAddress()
    .map((m) => m.toString())
    .join(", \n")}`,
);
