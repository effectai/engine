import { BN } from "@coral-xyz/anchor";
export function trimAddress(address, length = 6) {
	if (address.length <= length * 2) return address;
	return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export const formatBigIntToAmount = (amount: bigint): number => {
	return Number(amount) / 10 ** 6;
};

export const formatAmount = (amount: number): string => {
	return amount.toLocaleString();
};
