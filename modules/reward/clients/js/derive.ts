import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import { EFFECT_REWARD_PROGRAM_ADDRESS } from "./@generated";

export const deriveRewardAccountsPda = async ({
  mint,
}: {
  mint: Address;
}) => {
  const [reflectionAccount] = await getProgramDerivedAddress({
    seeds: [
      Buffer.from("reflection", "utf-8"),
      getAddressEncoder().encode(mint),
    ],
    programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
  });

  const [reflectionVaultAccount] = await getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(reflectionAccount)],
    programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
  });

  const [intermediaryReflectionVaultAccount] = await getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(reflectionVaultAccount)],
    programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
  });

  return {
    reflectionAccount,
    reflectionVaultAccount,
    intermediaryReflectionVaultAccount,
  };
};

export const deriveStakingRewardAccountPda = async ({
  stakingAccount,
}: {
  stakingAccount: Address;
}) => {
  const [stakingRewardAccount] = await getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(stakingAccount)],
    programAddress: EFFECT_REWARD_PROGRAM_ADDRESS,
  });

  return {
    stakingRewardAccount,
  };
};
