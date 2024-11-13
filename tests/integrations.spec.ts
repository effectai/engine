import { exampleBatch } from "environments/playground/constants/exampleBatch";
import { Batch, Libp2pNode } from "packages/core/src";
import { createManagerNode } from "packages/manager/src";
import type { createProviderNode } from "packages/provider/src";
import { fromString } from '@effectai/task-core'
import { createBootstrapRelayerServer } from "packages/relay/src";
import { createWorkerNode } from "packages/worker/src";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";

describe("Manager <-> Provider", () => {
	let relay: Awaited<ReturnType<typeof createBootstrapRelayerServer>>;
	let manager: Awaited<ReturnType<typeof createManagerNode>>;
	let provider: Awaited<ReturnType<typeof createProviderNode>>;

	beforeAll(async () => {
		relay = await createBootstrapRelayerServer();
		await relay.start();

		const relayMultiaddr = relay.getMultiaddrs()[0];

		manager = await createManagerNode([relayMultiaddr.toString()]);
		await manager.start();

		// provider = await createProviderNode([relayMultiaddr.toString()]);
		// await provider.start();
	});

	afterAll(async () => {
		await manager.stop();
		// await provider.stop();
		await relay.stop();
	});

	it(
		"tests the workers taskManager",
		async () => {
			const worker = await createWorkerNode([
				relay.getMultiaddrs()[0].toString(),
			]);
			await worker.start();

			await manager.services.kadDHT.setMode('server')
			await relay.services.kadDHT.setMode('server')
			// wait for worker to pair with manager
			await new Promise((resolve) => setTimeout(resolve, 10000));

			const peerRouting = await worker.peerRouting.findPeer(manager.peerId, {
				onProgress: ({detail}) => {
					console.log("peerId", detail);
				},
			});
			
			// store a test value in the manager DHT and access it from the worker
			const key = fromString('/v/hallo')
			const value = fromString('world')

			await manager.contentRouting.put(key, value)

			// wait for the DHT to store the value
			await new Promise((resolve) => setTimeout(resolve, 10000));
			console.log("waiting for value")
			const data = await worker.contentRouting.get(Buffer.from(key), {
				onProgress: ({detail}) => {
					console.log("value", detail);
				}
			});
			console.log(data)

			expect(peerRouting).toBeDefined();
		},
		{
			timeout: 90000,
		},
	);

	// it(
	// 	"checks peer-discovery between manager and provider",
	// 	async () => {
	// 		// start relay
	// 		const relayMultiaddr = relay.getMultiaddrs()[0];

	// 		// wait for discovery
	// 		await new Promise((resolve) => setTimeout(resolve, 5000));

	// 		const managerPeers = await manager.node.peerStore.all();
	// 		const providerPeers = await provider.node.peerStore.all();

	// 		// expect to have 2 peers (relay and provider)
	// 		expect(managerPeers).toHaveLength(2);

	// 		// expect to have 1 peer with peerType Provider
	// 		expect(
	// 			managerPeers.find((peer) => peer.tags.get("peerType")?.value === 3),
	// 		).toBeDefined();

	// 		// expect to have 2 peers (relay and manager)
	// 		expect(providerPeers).toHaveLength(2);

	// 		// expect to have 1 peer with peerType Manager
	// 		expect(
	// 			providerPeers.find((peer) => peer.tags.get("peerType")?.value === 2),
	// 		).toBeDefined();
	// 	},
	// 	{ timeout: 10000},
	// );

	// it("offers a batch from provider to manager", async () => {
	// 	const worker = await createWorkerNode([relay.getMultiaddrs()[0].toString()]);
	// 	await worker.start();
	// 	worker.listenForTask();

	// 	// wait for worker to pair with manager
	// 	await new Promise((resolve) => setTimeout(resolve, 6000));

	// 	const ma = manager.node.getMultiaddrs()[0];
	// 	await provider.offerBatch(ma, exampleBatch);

	// 	await worker.stop();
	// }, { timeout: 12000 });
});
