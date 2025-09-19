import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, maxFrac = 6) {
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
}

export function formatPercent(n: number, maxFrac = 2) {
  if (!Number.isFinite(n)) return "0%";
  return `${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  })}%`;
}

export function trimTrailingZeros(n: number) {
  const s = n.toFixed(9);
  return s.replace(/\.?0+$/, "");
}

export function shorten(addr: string, head = 6, tail = 4) {
  return addr.length <= head + tail + 1
    ? addr
    : `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
