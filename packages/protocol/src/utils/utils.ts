import type {
	Ed25519PublicKey,
	IncomingStreamData,
	PeerId,
} from "@libp2p/interface";
import type { ConnectionManager } from "@libp2p/interface-internal";
import { Uint8ArrayList } from "uint8arraylist";
import { PublicKey } from "@solana/web3.js";

export const getOpenOutboundConnections = (
	connectionManager: ConnectionManager,
	peerId: PeerId,
) => {
	const connections = connectionManager.getConnections(peerId);
	return connections.filter((conn) => conn.status === "open");
};

export const getActiveOutBoundConnections = async (
	connectionManager: ConnectionManager,
	peerId: PeerId,
) => {
	const connections = getOpenOutboundConnections(connectionManager, peerId);
	return connections.filter((conn) => conn.direction === "outbound");
};

export const handleMessage = async (streamData: IncomingStreamData) => {
	const data = new Uint8ArrayList();

	for await (const chunk of streamData.stream.source) {
		data.append(chunk);
	}

	return JSON.parse(new TextDecoder().decode(data.subarray()));
};

export const extractPeerIdFromTaskResults = (taskResults: string) => {
	const results = JSON.parse(taskResults);
	return { peerId: results.worker };
};

export const getOrCreateConnection = async (
	connectionManager: ConnectionManager,
	peerId: PeerId,
) => {
	const connections = await getActiveOutBoundConnections(
		connectionManager,
		peerId,
	);

	if (connections.length > 0) {
		return connections[0];
	}

	return await connectionManager.openConnection(peerId);
};

export const LibP2pPublicKeyToSolanaPublicKey = (
	publicKey: Ed25519PublicKey,
) => {
	const extractedPubKey = publicKey.raw;
	// Ensure it's an Ed25519 key (libp2p uses a prefix, remove it)
	if (extractedPubKey[0] !== 0) {
		// Ed25519 keys have prefix 0x00 in libp2p
		return new PublicKey(extractedPubKey);
	}

	return new PublicKey(publicKey);
};

export const bigIntToUint8Array = (bigint) => {
	const array = new Uint8Array(8); // 64-bit = 8 bytes
	const view = new DataView(array.buffer);
	view.setBigUint64(0, bigint, false); // false = Big-endian (MSB first)
	return array;
};

export const uint8ArrayToBigInt = (uint8Array) => {
	return new DataView(uint8Array.buffer).getBigUint64(0, false); // false = big-endian
};
// Convert back
