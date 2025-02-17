import type { IncomingStreamData, PeerId } from "@libp2p/interface";
import type { Libp2p } from "libp2p";
import { Uint8ArrayList } from "uint8arraylist";

export const getOpenOutboundConnections = (node: Libp2p, peerId?: PeerId) => {
	const connections = node.getConnections(peerId);
	return connections.filter((conn) => conn.status === "open");
};

export const getActiveOutBoundStreams = async (
	node: Libp2p,
	peerId?: PeerId,
) => {
	const connections = getOpenOutboundConnections(node, peerId);
	const streams = connections.map((conn) => conn.streams);
	console.log("streams:", streams);
	return streams.flat();
};

export const handleMessage = async (streamData: IncomingStreamData) => {
	const data = new Uint8ArrayList();

	for await (const chunk of streamData.stream.source) {
		data.append(chunk);
	}

	return JSON.parse(new TextDecoder().decode(data.subarray()));
};
