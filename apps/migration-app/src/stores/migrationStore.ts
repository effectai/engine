import type { SourceChain, SourceWallet } from "@/lib/wallet-types";
import { deriveMigrationAccountPDA } from "@effectai/migration";
import type { Address } from "@solana/kit";
import { create } from "zustand";

type MigrationStore = {
  foreignPublicKey: Uint8Array | null;
  setForeignPublicKey: (key: Uint8Array | null, mint: Address) => void;
  migrationAddress: Address | null;
  migrationVaultAddress: Address | null;

  signature: Uint8Array | null;
  setSignature: (sig: Uint8Array | null) => void;

  message: Uint8Array | null;
  setMessage: (msg: Uint8Array | null) => void;

  sourceChain: SourceChain | null;
  setSourceChain: (c: SourceChain | null) => void;

  sourceWallet: SourceWallet | null;
  setSourceWallet: (w: SourceWallet | null, mint: Address) => void;

  destinationAddress: string | null;
  setDestinationAddress: (address: string | null) => void;

  disconnect: () => void;
  authorize: () => Promise<boolean>;
  authorizeUrl: () => string;

  currentStep: "intro" | "authenticate" | "solana" | "authorize" | "claim";

  goTo: (
    step: "intro" | "solana" | "authorize" | "claim" | "authenticate",
  ) => void;
};

export const useMigrationStore = create<MigrationStore>((set, get) => ({
  currentStep: "intro",
  goTo: (step) => set({ currentStep: step }),

  migrationAddress: null,
  foreignPublicKey: null,
  migrationVaultAddress: null,

  sourceEfxBalance: null,
  sourceNativeBalance: null,

  sourceChain: null,
  setSourceChain: (c: SourceChain | null) => {
    set({ sourceChain: c });
  },

  sourceWallet: null,
  setSourceWallet: async (w: SourceWallet | null, mint: Address) => {
    if (!w) {
      // clear everything if wallet is unset
      set({
        sourceWallet: null,
        foreignPublicKey: null,
        migrationAddress: null,
        migrationVaultAddress: null,
        signature: null,
        message: null,
      });
      return;
    }

    set({ sourceWallet: w });

    try {
      const foreignPublicKey = await w.getForeignPublicKey();
      if (foreignPublicKey && mint) {
        get().setForeignPublicKey(foreignPublicKey, mint);
      }
    } catch (err) {
      console.error("Failed to get foreign public key from wallet:", err);
    }
  },

  destinationAddress: null,
  setDestinationAddress: (address) => set({ destinationAddress: address }),

  setForeignPublicKey: async (key, mint) => {
    console.log("Setting foreign public key:", key);
    if (!key) {
      set({
        foreignPublicKey: null,
        migrationAddress: null,
        migrationVaultAddress: null,
        signature: null,
        message: null,
      });
      return;
    }

    const prevAddr = get().migrationAddress;

    const { migrationAccount, vaultAccount } = await deriveMigrationAccountPDA({
      foreignAddress: key,
      mint,
    });

    set({
      foreignPublicKey: key,
      migrationAddress: migrationAccount,
      migrationVaultAddress: vaultAccount,
      signature: prevAddr === migrationAccount ? get().signature : null,
      message: prevAddr === migrationAccount ? get().message : null,
    });
  },

  signature: null,
  setSignature: (sig) => set({ signature: sig }),
  message: null,
  setMessage: (msg) => set({ message: msg }),

  disconnect: () => {
    set({
      foreignPublicKey: null,
      migrationAddress: null,
      migrationVaultAddress: null,
      signature: null,
      message: null,
      sourceChain: null,
      sourceWallet: null,
    });
  },

  authorize: async () => {
    const { sourceWallet, migrationAddress } = get();
    if (!sourceWallet || !migrationAddress) return false;
    console.log("Authorizing with migration address", migrationAddress);

    const { signature, message } =
      await sourceWallet.authorizeTokenClaim(migrationAddress);

    set({ signature, message });
    return true;
  },

  authorizeUrl: () => {
    const { signature, message, foreignPublicKey } = get();
    if (!signature || !message || !foreignPublicKey) return "";
    const payload = Buffer.from(
      JSON.stringify({ signature, message, foreignPublicKey }),
    ).toString("base64");

    return `${typeof window !== "undefined" ? window.location.origin : ""}/migrate?auth=${payload}`;
  },
}));
