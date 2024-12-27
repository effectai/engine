import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";

export const calculateStakeAge = (timestamp: number) => {
    const now = Date.now() / 1000;
    const stakeAge = (now - timestamp) / 100;
    const maxStakeAge = (1000 * 24 * 60 * 60) / 100;
    return Math.min(stakeAge, maxStakeAge); 
}

export function isValidSolanaAddress(address: string) {
	try {
		const decoded = bs58.decode(address);

		if (decoded.length !== 32) {
			return false;
		}

		new PublicKey(address); 
		return true;
	} catch (error) {
		return false;
	}
}

export function extractAuthorizedSolanaAddress(text: string) {
	const pattern =
		/I authorize my tokens to be claimed at the following Solana address:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/;
	const match = text.match(pattern);

	if (match) {
		const address = match[1];
		try {
			new PublicKey(address); 
			return address;
		} catch {
			return null;
		}
	}
	return null; // No match found
}
