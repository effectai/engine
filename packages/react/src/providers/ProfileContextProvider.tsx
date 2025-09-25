import { address as toAddress, type Address } from "@solana/kit";
import { createContext, useContext } from "react";
import { type Profile, type ProfileName, profiles } from "@effectai/config";

type ProfileContextProviderValue = {
  mint: Address;
  rpcUrl: string;
  rpcWsUrl: string;
  cluster: string;
  explorerCluster: string;
};

const ProfileContext = createContext<ProfileContextProviderValue | undefined>(
  undefined,
);

export function ProfileContextProvider({
  profile,
  children,
}: { profile?: ProfileName; children: React.ReactNode }) {
  const PROFILE_NAME = (profile ||
    process.env.VITE_EFFECT_PROFILE ||
    "mainnet") as ProfileName;

  console.log("Using EFFECT profile:", PROFILE_NAME);

  const base = profiles[PROFILE_NAME];
  if (!base) throw new Error(`Unknown EFFECT profile: ${PROFILE_NAME}`);

  const withOverrides: Profile = {
    ...base,
    EFFECT_SPL_MINT: process.env.VITE_EFFECT_SPL_MINT || base.EFFECT_SPL_MINT,
    EFFECT_SOLANA_RPC_NODE_URL:
      process.env.VITE_EFFECT_SOLANA_RPC_NODE_URL ||
      base.EFFECT_SOLANA_RPC_NODE_URL,
    EFFECT_SOLANA_RPC_WS_URL:
      process.env.VITE_PUBLIC_EFFECT_SOLANA_RPC_WS_URL ||
      base.EFFECT_SOLANA_RPC_WS_URL,
  };

  // Map "localnet" cluster to "custom" for explorer compatibility
  const explorerCluster =
    withOverrides.EFFECT_CLUSTER === "localnet"
      ? "custom"
      : withOverrides.EFFECT_CLUSTER;

  return (
    <ProfileContext.Provider
      value={{
        mint: toAddress(withOverrides.EFFECT_SPL_MINT) as Address,
        rpcUrl: withOverrides.EFFECT_SOLANA_RPC_NODE_URL,
        rpcWsUrl: withOverrides.EFFECT_SOLANA_RPC_WS_URL,
        cluster: withOverrides.EFFECT_CLUSTER,
        explorerCluster: explorerCluster,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx)
    throw new Error(
      "useProfileContext must be used within a ProfileContextProvider",
    );
  return ctx;
}
