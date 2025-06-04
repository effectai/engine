import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sliceBoth = (str: string) => {
  if (str.length <= 12) return str;
  return `${str.slice(0, 6)}...${str.slice(-6)}`;
};
