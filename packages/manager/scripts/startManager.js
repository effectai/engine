import { createManagerNode } from "../dist/index.js";

const manager = await createManagerNode();

await manager.start();

console.log("Manager started on port", manager.node.getMultiaddrs());