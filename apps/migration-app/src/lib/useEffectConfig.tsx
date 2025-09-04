import { type Profile, type ProfileName, profiles } from "@effectai/config";

const PROFILE_NAME = (process.env.NEXT_PUBLIC_EFFECT_PROFILE ||
  "localnet") as ProfileName;

const base = profiles[PROFILE_NAME];
if (!base) throw new Error(`Unknown EFFECT profile: ${PROFILE_NAME}`);

const withOverrides: Profile = {
  ...base,
  EFFECT_SPL_MINT:
    process.env.NEXT_PUBLIC_EFFECT_SPL_MINT || base.EFFECT_SPL_MINT,
  EFFECT_SOLANA_RPC_NODE_URL:
    process.env.NEXT_PUBLIC_EFFECT_SOLANA_RPC_NODE_URL ||
    base.EFFECT_SOLANA_RPC_NODE_URL,
  EFFECT_SOLANA_RPC_WS_URL:
    process.env.NEXT_PUBLIC_EFFECT_SOLANA_RPC_WS_URL ||
    base.EFFECT_SOLANA_RPC_WS_URL,
};

export const EFFECT = withOverrides;
