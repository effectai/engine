import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sliceBoth = (str: string) => {
  if (str.length <= 12) return str;
  return `${str.slice(0, 6)}...${str.slice(-6)}`;
};

export const formatReward = (reward: bigint) => {
  return new Intl.NumberFormat().format(reward / BigInt(1e6));
};

export const EFFECT_DECIMALS = 6;

export const formatEffect = (rawAmount: bigint, maximumFractionDigits = 4) => {
  const scale = 10n ** BigInt(EFFECT_DECIMALS);
  const isNegative = rawAmount < 0n;
  const absoluteAmount = isNegative ? -rawAmount : rawAmount;

  const wholePart = new Intl.NumberFormat().format(absoluteAmount / scale);
  const fractionPart = (absoluteAmount % scale)
    .toString()
    .padStart(EFFECT_DECIMALS, "0")
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");

  const sign = isNegative ? "-" : "";
  return fractionPart
    ? `${sign}${wholePart}.${fractionPart}`
    : `${sign}${wholePart}`;
};

export const toDate = (unixSeconds: number) => new Date(unixSeconds * 1000);

export const formatTimestamp = (unixSeconds: number | undefined | null) => {
  if (!unixSeconds) return "Never";
  return toDate(unixSeconds).toLocaleString();
};

export const formatCount = (value: number) =>
  new Intl.NumberFormat().format(value);

export const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

export const getSuccessRate = ({
  tasksCompleted,
  totalTasks,
}: {
  tasksCompleted: number;
  totalTasks: number;
}): number | null => {
  if (!totalTasks) return null;
  return (tasksCompleted / totalTasks) * 100;
};

export const formatCapabilityId = (capabilityId: string) => {
  const withoutVersion = capabilityId.split(":")[0];
  const name = withoutVersion.split("/").pop() ?? withoutVersion;

  return name
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
