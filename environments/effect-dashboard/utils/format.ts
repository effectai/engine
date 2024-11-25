import { BN } from "@coral-xyz/anchor";

export const sliceBoth = (str: string) => {
	if(str.length <= 12) return str;
	return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

export const amountToBalance = (amount: BN) => {
	return amount.toNumber() / 10 ** 6;
}

export const balanceToAmount = (balance: number): BN => {
	return new BN(balance * 10 ** 6);
}