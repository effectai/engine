import {
  deriveRewardAccountsPda,
  deriveStakingRewardAccountPda,
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
import {
  generateKeyPairSigner,
  type Address,
  type Instruction,
  type Rpc,
  type SolanaRpcApiMainnet,
  type TransactionSigner,
} from "@solana/kit";

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
    ? [claimIx, closeIx, unstakeIx]
    : [unstakeIx];
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
