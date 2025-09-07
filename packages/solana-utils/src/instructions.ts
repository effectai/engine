import {
  deriveRewardAccountsPda,
  deriveStakingRewardAccountPda,
  EFFECT_REWARDS_PROGRAM_ADDRESS,
  fetchMaybeRewardAccount,
  getClaimInstructionAsync,
  getCloseInstructionAsync,
  getEnterInstructionAsync,
  getSyncInstructionAsync,
} from "@effectai/reward";

import {
  getTopupInstructionAsync,
  getUnstakeInstructionAsync,
} from "@effectai/stake";

import { getTopupInstructionAsync as getRewardTopupInstructionAsync } from "@effectai/reward";

import {
  generateKeyPairSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Address,
  type Instruction,
  type Rpc,
  type SolanaRpcApiMainnet,
  type TransactionSigner,
} from "@solana/kit";

import {
  fetchVestingAccount,
  getClaimInstructionAsync as getVestingClaimInstructionAsync,
} from "@effectai/vesting";
import { getCreateAssociatedTokenInstructionAsync } from "@solana-program/token";

export const buildClaimRewardsInstruction = async ({
  mint,
  stakeAccount,
  recipientTokenAccount,
  vestingAccount,
  rpc,
  signer,
}: {
  rpc: Rpc<SolanaRpcApiMainnet>;
  vestingAccount: Address;
  recipientTokenAccount: Address;
  stakeAccount: Address;
  mint: Address;
  signer: TransactionSigner;
}): Promise<Instruction[]> => {
  const [reflectionAccount] = await getProgramDerivedAddress({
    seeds: [
      Buffer.from("reflection", "utf-8"),
      getAddressEncoder().encode(mint),
    ],

    programAddress: EFFECT_REWARDS_PROGRAM_ADDRESS,
  });

  const vestingAccountData = await fetchVestingAccount(rpc, vestingAccount);

  const claimVestingIx = await getVestingClaimInstructionAsync({
    recipientTokenAccount: vestingAccountData.data.recipientTokenAccount,
    vestingAccount,
    authority: signer,
  });

  const topupRewardPoolIx = await getRewardTopupInstructionAsync({
    mint,
  });

  const claimIx = await getClaimInstructionAsync({
    stakeAccount,
    authority: signer,
    reflectionAccount,
    recipientTokenAccount,
  });

  return [claimVestingIx, topupRewardPoolIx, claimIx];
};

export const buildUnstakeInstruction = async ({
  mint,
  userTokenAccount,
  stakeAccount,
  rpc,
  signer,
  amount,
}: {
  amount: number;
  rpc: Rpc<SolanaRpcApiMainnet>;
  userTokenAccount: Address;
  stakeAccount: Address;
  mint: Address;
  signer: TransactionSigner;
}): Promise<Instruction[]> => {
  const { stakingRewardAccount } = await deriveStakingRewardAccountPda({
    stakingAccount: stakeAccount,
  });

  const maybeStakingRewardAccount = await fetchMaybeRewardAccount(
    rpc,
    stakingRewardAccount,
  );

  const { reflectionAccount } = await deriveRewardAccountsPda({ mint });

  const claimIx = await getClaimInstructionAsync({
    stakeAccount,
    authority: signer,
    reflectionAccount,
    recipientTokenAccount: userTokenAccount,
  });

  const closeIx = await getCloseInstructionAsync({
    stakeAccount,
    authority: signer,
    reflectionAccount,
  });

  const enterRewardPoolIx = await getEnterInstructionAsync({
    mint,
    stakeAccount,
    authority: signer,
  });

  const vestingAccount = await generateKeyPairSigner();

  const unstakeIx = await getUnstakeInstructionAsync({
    mint,
    vestingAccount,
    recipientTokenAccount: userTokenAccount,
    stakeAccount,
    authority: signer,
    amount,
  });

  return maybeStakingRewardAccount.exists
    ? [claimIx, closeIx, unstakeIx, enterRewardPoolIx]
    : [unstakeIx, enterRewardPoolIx];
};

export const buildTopupInstruction = async ({
  mint,
  userTokenAccount,
  stakeAccount,
  rpc,
  signer,
  amount,
}: {
  amount: number;
  rpc: Rpc<SolanaRpcApiMainnet>;
  userTokenAccount: Address;
  stakeAccount: Address;
  mint: Address;
  signer: TransactionSigner;
}): Promise<Instruction[]> => {
  const { stakingRewardAccount } = await deriveStakingRewardAccountPda({
    stakingAccount: stakeAccount,
  });

  const maybeStakingRewardAccount = await fetchMaybeRewardAccount(
    rpc,
    stakingRewardAccount,
  );

  const enterRewardPoolIx = await getEnterInstructionAsync({
    mint,
    stakeAccount,
    authority: signer,
  });

  const topupIx = await getTopupInstructionAsync({
    userTokenAccount,
    stakeAccount,
    authority: signer,
    amount,
  });

  const { reflectionAccount } = await deriveRewardAccountsPda({ mint });
  const syncRewardsIx = await getSyncInstructionAsync({
    reflectionAccount: reflectionAccount,
    stakeAccount,
  });

  return maybeStakingRewardAccount.exists
    ? [topupIx, syncRewardsIx]
    : [enterRewardPoolIx, topupIx, syncRewardsIx];
};

export const maybeCreateAssociatedTokenAccountInstructions = async ({
  rpc,
  tokenAddress,
  signer,
  mint,
  owner,
}: {
  signer: TransactionSigner;
  rpc: Rpc<SolanaRpcApiMainnet>;
  tokenAddress: Address;
  mint: Address;
  owner: Address;
}) => {
  const account = await rpc.getAccountInfo(tokenAddress).send();
  if (!account || account.value === null) {
    console.log("Creating associated token account for", owner, mint);
    return getCreateAssociatedTokenInstructionAsync({
      payer: signer,
      mint,
      owner,
    });
  }
  return [];
};
