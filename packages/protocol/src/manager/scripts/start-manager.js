import { createManager } from "./../../../dist/manager/main.js";
import { generateKeyPairFromSeed } from "@libp2p/crypto/keys";
import { randomBytes } from "node:crypto";
import { LevelDatastore } from "datastore-level";

const managerPrivateKey = await generateKeyPairFromSeed(
  "Ed25519",
  randomBytes(32),
);

const datastore = new LevelDatastore("/tmp/manager");
await datastore.open();

const manager = await createManager({
  privateKey: managerPrivateKey,
  datastore,

  //automatically start managing tasks
  autoManage: true,
});
