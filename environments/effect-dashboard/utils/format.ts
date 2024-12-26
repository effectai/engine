import { BN } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";
import { format, formatDistanceToNow } from "date-fns";

export const sliceBoth = (str: string) => {
	if (str.length <= 12) return str;
	return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

export const formatAmountToBalance = (amount: BN) => {
	const result = amount.div(new BN(10 ** 6));
	if (result.gt(new BN(Number.MAX_SAFE_INTEGER))) {
		throw new Error("Value exceeds JavaScript safe integer limit.");
	}
	return result.toNumber()// 6 decimals
};

export const formatBalanceToAmount = (balance: number): BN => {
	return new BN(balance * 10 ** 6);
};

export const formatDate = (date: Date): string => {
	return format(date, "MMM d, yyyy");
};

export const formatTimeFromNow = (date: Date): string => {
	return formatDistanceToNow(date, { addSuffix: true });
};

export const formatAmount = (amount: number): string => {
	return amount.toLocaleString();
};

export const formatPercent = (decimal: number): string => {
	return `${(decimal * 100).toFixed(1)}%`;
};

export const formatNumber = (num: number) => {
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
};

export const formatTimestampToTimeAgo = (timestamp: number) => {
	return formatDistanceToNow(timestamp, { addSuffix: true });
};

export function isValidSolanaAddress(address: string) {
	try {
		const decoded = bs58.decode(address);

		if (decoded.length !== 32) {
			return false;
		}

		new PublicKey(address); // Throws if invalid
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
		const address = match[1]; // The captured address
		try {
			// Validate the address using Solana's PublicKey utility
			new PublicKey(address); // Throws if invalid
			return address;
		} catch {
			return null; // Invalid address
		}
	}
	return null; // No match found
}
