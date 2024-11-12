import type { PeerId } from "@libp2p/interface";
import type { Libp2p } from "libp2p";

export const getOpenOutboundConnections = (node: Libp2p, peerId?: PeerId) => {
	const connections = node.getConnections(peerId);
	console.log("connections:", connections);
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
