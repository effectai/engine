import { address } from "@solana/kit";

export const publicKeyString = ref<string | null>(null);

export const useEffectConfig = () => {
  const config = useRuntimeConfig();

  if (!config.public.EFFECT_SPL_TOKEN_MINT) {
    throw new Error(
      "EFFECT_SPL_TOKEN_MINT not set. Please set it in your .env file",
    );
  }

  const mint = address(config.public.EFFECT_SPL_TOKEN_MINT);

  if (!config.public.EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT) {
    throw new Error(
      "EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT not set. Please set it in your .env file",
    );
  }

  const activeRewardVestingAccount = address(
    config.public.EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT,
  );

  return {
    mint,
    activeRewardVestingAccount,
  };
};
