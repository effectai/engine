import { BN } from "@coral-xyz/anchor";
import { format, formatDistanceToNow } from "date-fns";

export const sliceBoth = (str: string) => {
	if (str.length <= 12) return str;
	return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

export const amountToBalance = (amount: BN) => {
	return amount.toNumber() / 10 ** 6;
};

export const balanceToAmount = (balance: number): BN => {
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
