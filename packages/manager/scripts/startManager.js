import { createManagerNode } from "../dist/index.js";

const manager = await createManagerNode(["/ip4/127.0.0.1/tcp/15006/ws/p2p/12D3KooWC7n5gLJciHeke7qv5SjJ9CjDKCaRFX5NKErQr9jFMfhh"]);

await manager.start();

console.log("Manager started on port", manager.node.getMultiaddrs());

// every 5 seconds, print the number of peers connected
setInterval(async () => {
    const peers = await manager.node.peerStore.all();
    console.log("Number of peers connected:", peers.length);
}, 5000);
