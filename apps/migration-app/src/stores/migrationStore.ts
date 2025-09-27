import { create } from "zustand";
import { deriveMigrationAccountPDA } from "@effectai/migration";
import type { Address } from "@solana/kit";
import type { SourceChain } from "@/lib/wallet-types";

type Step = "intro" | "authenticate" | "solana" | "authorize" | "claim";

type MigrationStore = {
  // flow / ui
  currentStep: Step;
  goTo: (step: Step) => void;

  // chain selection
  sourceChain: SourceChain | null;
  setSourceChain: (c: SourceChain | null) => void;

  // wallet & derived addresses
  foreignPublicKey: Uint8Array | null;
  setForeignPublicKey: (key: Uint8Array | null, mint: Address) => Promise<void>;

  //derived from foreignPublicKey
  migrationAddress: Address | null;
  migrationVaultAddress: Address | null;

  // auth payload
  signature: Uint8Array | null;
  setSignature: (sig: Uint8Array | null) => void;
  message: Uint8Array | null;
  setMessage: (msg: Uint8Array | null) => void;

  // dest
  destinationAddress: string | null;
  setDestinationAddress: (address: string | null) => void;

  // actions
  disconnect: () => void;
  authorizeUrl: () => string;
};

// small, browser-safe base64url helper
function toBase64Url(u8: Uint8Array) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  const b64 = (
    typeof btoa !== "undefined"
      ? btoa(s)
      : Buffer.from(s, "binary").toString("base64")
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return b64;
}

export const useMigrationStore = create<MigrationStore>()((set, get) => ({
  currentStep: "intro",
  goTo: (step) => set({ currentStep: step }),

  sourceChain: null,
  setSourceChain: (c) => {
    set({ sourceChain: c });
  },

  destinationAddress: null,
  setDestinationAddress: (address) => set({ destinationAddress: address }),

  // non-persisted flow helpers
  pendingChain: null,
  connectingChain: null,

  // wallet & derived
  migrationAddress: null,
  migrationVaultAddress: null,
  foreignPublicKey: null,

  setForeignPublicKey: async (key, mint) => {
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

    const { migrationAccount, vaultAccount } = await deriveMigrationAccountPDA({
      foreignAddress: key,
      mint,
    });

    set({
      foreignPublicKey: key,
      migrationAddress: migrationAccount,
      migrationVaultAddress: vaultAccount,
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
    });
  },

  authorizeUrl: () => {
    const { signature, message, foreignPublicKey } = get();
    if (!signature || !message || !foreignPublicKey) return "";

    const payload = toBase64Url(
      new Uint8Array(
        new TextEncoder().encode(
          JSON.stringify({ signature, message, foreignPublicKey }),
        ),
      ),
    );

    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    return `${origin}/migrate?auth=${payload}`;
  },
}));
