import {
	circuitRelayServer,
	circuitRelayTransport,
	createLibp2p,
	filters,
	identify,
	kadDHT,
	multiaddr,
	bootstrap,
	noise,
	peerIdFromString,
	removePublicAddressesMapper,
	webRTC,
	webSockets,
	yamux,
} from "packages/core/dist";
import { createManagerNode } from "packages/manager/src";
import { createBootstrapRelayerServer } from "packages/relay/src";
import { expect, test, afterEach, beforeEach, it } from "vitest";

it('tests the pubsub discovery', async () => {
	const relay = await createBootstrapRelayerServer()
	
	// get relay multi
	const relayMulti = relay.getMultiaddrs()[0]
	const manager = await createManagerNode([relayMulti.toString()])

	// start manager
	await manager.start()

	// every 5 seconds get all the metadata from peerstore
	setInterval(async () => {
		const peers = await manager.node?.peerStore.all()
		
	}, 5000)
	

	// wait 20 seconds
	await new Promise((resolve) => setTimeout(resolve, 20000))
}, { timeout: 30000 })