import type { VestingAccount } from "@effectai/vesting";
import type {
  Account,
  Address,
  KeyPairSigner,
  TransactionSigner,
} from "@solana/kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getClaimInstructionAsync as getClaimVestingInstructionAsync } from "@effectai/vesting";
import {
  deriveRewardAccountsPda,
  getClaimInstructionAsync as getClaimRewardInstructionAsync,
  getEnterInstructionAsync,
} from "@effectai/reward";
import type { Connection } from "solana-kite";
import {
  generateKeyPairSigner,
  SolanaError,
  address as toAddress,
} from "@solana/kit";
import { EFFECT } from "./useEffectConfig";
import {
  buildClaimRewardsInstruction,
  buildTopupInstruction,
} from "@effectai/solana-utils";
import { executeTransaction } from "./helpers";
import { getStakeInstructionAsync, type StakeAccount } from "@effectai/stake";

export const useClaimVestingMutation = () => {
  return useMutation({
    mutationKey: ["claim-vesting"],
    mutationFn: async (args: {
      connection: Connection;
      signer: TransactionSigner;
      recipientTokenAccount: Address;
      vestingAccount: Account<VestingAccount>;
    }) => {
      const { signer, vestingAccount, recipientTokenAccount, connection } =
        args;
      if (!signer) throw new Error("No signer");
      if (!vestingAccount) throw new Error("No vesting account");

      const claimIx = await getClaimVestingInstructionAsync({
        recipientTokenAccount: recipientTokenAccount,
        vestingAccount: vestingAccount.address,
        authority: signer,
      });

      return await connection.sendTransactionFromInstructions({
        feePayer: signer as unknown as KeyPairSigner,
        instructions: [claimIx],
        maximumClientSideRetries: 3,
      });
    },
  });
};

export const useTopupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["topup-stake"],
    mutationFn: async ({
      connection,
      signer,
      stakeAccount,
      userTokenAccount,
      amount,
    }: {
      connection: Connection;
      signer: TransactionSigner;
      stakeAccount: Account<StakeAccount>;
      userTokenAccount: Address;
      amount: number;
    }) => {
      const topupInstructions = await buildTopupInstruction({
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
        stakeAccount: stakeAccount.address,
        amount: amount * 1e6,
        userTokenAccount,
        rpc: connection.rpc,
        signer,
      });

      return executeTransaction(connection, signer, topupInstructions);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["staking"],
      });
    },
  });
};

export const useStakeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["stake"],
    mutationFn: async ({
      connection,
      signer,
      userTokenAccount,
      amount,
    }: {
      connection: Connection;
      signer: TransactionSigner;
      userTokenAccount: Address;
      amount: number;
    }) => {
      const stakeAccount = await generateKeyPairSigner();

      const stakeInstruction = await getStakeInstructionAsync({
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
        stakeAccount,
        amount: amount * 1e6,
        duration: 30 * 24 * 60 * 60, // 30 days
        authority: signer,
        userTokenAccount,
      });

      const enterRewardPoolIx = await getEnterInstructionAsync({
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
        stakeAccount: stakeAccount.address,
        authority: signer,
      });

      return await executeTransaction(connection, signer, [
        stakeInstruction,
        enterRewardPoolIx,
      ]);
    },
  });
};

export const useUnstakeMutation = () => {};

export const useClaimRewardMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["claim-reward"],
    mutationFn: async (args: {
      connection: Connection;
      signer: TransactionSigner;
      stakeAccountAddress: Address;
      recipientTokenAccount: Address;
    }) => {
      const { signer, stakeAccountAddress, connection, recipientTokenAccount } =
        args;

      const activeVestingAccount = import.meta.env
        .VITE_EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT;

      const claimRewardIx = await buildClaimRewardsInstruction({
        signer,
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
        vestingAccount: toAddress(activeVestingAccount),
        recipientTokenAccount,
        stakeAccount: stakeAccountAddress,
        rpc: connection.rpc,
      });

      return await executeTransaction(connection, signer, claimRewardIx);
    },
    onSuccess: (_data, variables) => {
      console.log("invalidating claim-reward queries");
      queryClient.invalidateQueries({ queryKey: ["staking"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
    onError: (error) => {
      if (error instanceof SolanaError) {
        console.error("SolanaError claiming reward:", error.context);
      }
    },
  });
};
