import type { VestingAccount } from "@effectai/vesting";
import type { Account, Address, TransactionSigner } from "@solana/kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getClaimInstructionAsync as getClaimVestingInstructionAsync } from "@effectai/vesting";
import { getEnterInstructionAsync } from "@effectai/reward";
import type { Connection } from "solana-kite";
import { generateKeyPairSigner, address as toAddress } from "@solana/kit";
import {
  buildClaimRewardsInstruction,
  buildTopupInstruction,
  buildUnstakeInstruction,
  executeTransaction,
} from "@effectai/solana-utils";
import { getStakeInstructionAsync, type StakeAccount } from "@effectai/staking";
import { useProfileContext, toast } from "@effectai/react";
import { notifyTransactionSuccess } from "./utils";

export const useClaimVestingMutation = () => {
  const queryClient = useQueryClient();
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

      return await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: [claimIx],
        commitment: "confirmed",
      });
    },
    onSuccess: (_data) => {
      console.log("invalidating claim-vesting queries");
      queryClient.invalidateQueries({ queryKey: ["vesting"] });
      queryClient.invalidateQueries({
        queryKey: ["balances"],
      });
    },
  });
};

export const useTopupMutation = () => {
  const queryClient = useQueryClient();
  const { mint, explorerCluster } = useProfileContext();

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
        mint,
        stakeAccount: stakeAccount.address,
        amount: amount * 1e6,
        userTokenAccount,
        rpc: connection.rpc,
        signer,
      });

      return await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: topupInstructions,
        commitment: "confirmed",
      });
    },
    onSuccess: (signature) => {
      notifyTransactionSuccess(
        signature,
        "Top-up successful",
        "Successfully topped up your stake.",
        explorerCluster,
      );
      queryClient.invalidateQueries({
        queryKey: ["staking"],
      });
      queryClient.invalidateQueries({
        queryKey: ["balances"],
      });
    },
    onError: (error) => {
      toast("Top-up failed", {
        description: error?.message || "An error occurred during top-up.",
      });
    },
  });
};

export const useStakeMutation = () => {
  const queryClient = useQueryClient();
  const { mint, explorerCluster } = useProfileContext();
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
        mint,
        scope: mint,
        allowTopup: true,
        stakeAccount,
        amount: amount * 1e6,
        duration: 30 * 24 * 60 * 60, // 30 days
        authority: signer,
        userTokenAccount,
      });

      const enterRewardPoolIx = await getEnterInstructionAsync({
        mint,
        stakeAccount: stakeAccount.address,
        authority: signer,
      });

      return await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: [stakeInstruction, enterRewardPoolIx],
        commitment: "confirmed",
      });
    },
    onSuccess: (signature) => {
      notifyTransactionSuccess(
        signature,
        "Stake successful",
        "Successfully staked your tokens.",
        explorerCluster,
      );

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["staking"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
};

export const useUnstakeMutation = () => {
  const queryClient = useQueryClient();
  const { mint, explorerCluster } = useProfileContext();
  return useMutation({
    mutationKey: ["unstake"],
    mutationFn: async (args: {
      connection: Connection;
      signer: TransactionSigner;
      stakeAccount: Account<StakeAccount>;
      recipientTokenAccount: Address;
      amount: number;
    }) => {
      const {
        signer,
        stakeAccount,
        recipientTokenAccount,
        amount,
        connection,
      } = args;

      const unstakeIx = await buildUnstakeInstruction({
        amount: amount * 1e6,
        mint,
        userTokenAccount: recipientTokenAccount,
        stakeAccount: stakeAccount.address,
        rpc: connection.rpc,
        signer,
      });

      return await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: unstakeIx,
        commitment: "confirmed",
      });
    },
    onSuccess: (signature) => {
      notifyTransactionSuccess(
        signature,
        "Unstake successful",
        "Successfully unstaked your tokens.",
        explorerCluster,
      );

      queryClient.invalidateQueries({ queryKey: ["staking"] });
      queryClient.invalidateQueries({ queryKey: ["vesting"] });
      queryClient.invalidateQueries({
        queryKey: ["balances"],
      });
    },
  });
};

export const useClaimRewardMutation = () => {
  const queryClient = useQueryClient();
  const { mint, explorerCluster } = useProfileContext();

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
        mint,
        vestingAccount: toAddress(activeVestingAccount),
        recipientTokenAccount,
        stakeAccount: stakeAccountAddress,
        rpc: connection.rpc,
      });

      return await executeTransaction({
        rpc: connection.rpc,
        rpcSubscriptions: connection.rpcSubscriptions,
        signer,
        instructions: claimRewardIx,
        commitment: "confirmed",
      });
    },
    onSuccess: (signature) => {
      notifyTransactionSuccess(
        signature,
        "Claim successful",
        "Successfully claimed your rewards.",
        explorerCluster,
      );

      queryClient.invalidateQueries({ queryKey: ["staking"] });
      queryClient.invalidateQueries({
        queryKey: ["balances"],
      });
    },
  });
};
