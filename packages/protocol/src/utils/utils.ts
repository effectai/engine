import type {
	Ed25519PublicKey,
	IdentifyResult,
	IncomingStreamData,
	PeerId,
} from "@libp2p/interface";
import type { ConnectionManager } from "@libp2p/interface-internal";
import { Uint8ArrayList } from "uint8arraylist";
import { PublicKey } from "@solana/web3.js";
import { peerIdFromString } from "@libp2p/peer-id";

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

export const bigIntToUint8Array = (bigint: bigint) => {
	const array = new Uint8Array(8); // 64-bit = 8 bytes
	const view = new DataView(array.buffer);
	view.setBigUint64(0, bigint, false); // false = Big-endian (MSB first)
	return array;
};

export const uint8ArrayToBigInt = (uint8Array: Uint8Array) => {
	return new DataView(uint8Array.buffer).getBigUint64(0, false); // false = big-endian
};

export const getOrCreateActiveOutBoundStream = async (
	peerId: string,
	connectionManager: ConnectionManager,
	protocol: string,
) => {
	const peer = peerIdFromString(peerId);

	const connections = connectionManager.getConnections(peer);

	let connection = connections.find((x) => x.status === "open");
	if (!connection) {
		connection = await connectionManager.openConnection(peer);
	}

	let stream = connection.streams.filter(
		(s) => s.status === "open" && s.metadata.effectai === true,
	)[0];

	stream = await connection.newStream(protocol);
	stream.metadata = {
		effectai: true,
	};

	return stream;
};

export const isManager = (info: IdentifyResult) => {
	console.log(info.protocols);
	return info.protocols.includes("/effectai/manager/0.0.1");
};

export const isWorker = (info: IdentifyResult) => {
	return info.protocols.includes("/effectai/worker/0.0.1");
};

export const int2hex = (i: string | number | bigint | boolean) =>
	`0x${BigInt(i).toString(16)}`;
