import { Connection, PublicKey } from "@solana/web3.js";

export const publicKeyString = ref<string | null>(null);

export const useGlobalState = () => {
  const config = useRuntimeConfig();

  if (!config.public.EFFECT_SPL_TOKEN_MINT) {
    throw new Error(
      "EFFECT_SPL_TOKEN_MINT not set. Please set it in your .env file",
    );
  }

  const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT);

  return {
    mint,
  };
};
