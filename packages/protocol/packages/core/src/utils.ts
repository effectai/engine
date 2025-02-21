import type { IncomingStreamData, PeerId } from "@libp2p/interface";
import type { ConnectionManager } from "@libp2p/interface-internal";
import { Uint8ArrayList } from "uint8arraylist";

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
