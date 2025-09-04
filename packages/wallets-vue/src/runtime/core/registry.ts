import type { Wallet } from "@wallet-standard/base";
import { markRaw } from "vue";

export async function discoverWallets(): Promise<Wallet[]> {
  if (typeof window === "undefined") return [];
  const { getWallets } = await import("@wallet-standard/app");

  const { get } = getWallets();
  const wallets = get() as Wallet[];

  return wallets;
}
