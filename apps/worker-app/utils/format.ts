import { format, formatDistanceToNow } from "date-fns";

export const sliceBoth = (str: string) => {
  if (str.length <= 12) return str;
  return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

export const formatAmountToBalance = (amount: bigint) => {
  return Number(amount) / 10 ** 6;
};

export const formatBalanceToAmount = (balance: number): bigint => {
  return BigInt(Math.floor(balance * 10 ** 6));
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

export const formatNumber = (num: number, digits?: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits ?? 2,
    maximumFractionDigits: digits ?? 2,
  }).format(num);
};

export const formatTimestampToTimeAgo = (timestamp: number) => {
  return formatDistanceToNow(timestamp, { addSuffix: true });
};

export const formatBigIntToAmount = (amount: bigint): number => {
  return Number(amount) / 10 ** 6;
};
