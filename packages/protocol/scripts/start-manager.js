import { createManagerNode } from "./../dist/manager/manager.js";

console.log("Starting manager node...");

const manager = await createManagerNode([]);

console.log("Manager node started");

const relayAddress = manager.getMultiaddrs()[0];

console.log("connecting on :", relayAddress.toString());

manager.services.peerQueue.addEventListener("peer:added", () => {
	console.log("Peer added to queue");
});

manager.addEventListener("peer:discovery", ({ detail }) => {
	console.log("Peer discovered");
});

//report some info every 10 seconds
setInterval(() => {
	const queue = manager.services.peerQueue.getQueue();
	console.log(`Queue size: ${queue.length}`);

	const peers = manager.getPeers();
	console.log(`Peers: ${peers.length}`);
}, 10000);
