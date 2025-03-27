import { peerIdFromString } from "@libp2p/peer-id";
import { PublicKey } from "@solana/web3.js";
// import crypto from "node:crypto";

export function generateSeed() {
	// return crypto.randomBytes(32);
}

export const getPublicKeyFromPeerId = (peerId: string) => {
	const peer = peerIdFromString(peerId);
	if (!peer.publicKey) {
		throw new Error("PeerId does not contain a public key");
	}

	return new PublicKey(peer.publicKey?.raw);
};
