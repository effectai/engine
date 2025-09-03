import type { VestingAccount } from "@effectai/vesting";
import type {
  Account,
  Address,
  KeyPairSigner,
  TransactionSigner,
} from "@solana/kit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getClaimInstructionAsync as getClaimVestingInstructionAsync } from "@effectai/vesting";
import { getEnterInstructionAsync } from "@effectai/reward";
import type { Connection } from "solana-kite";
import {
  generateKeyPairSigner,
  SolanaError,
  address as toAddress,
} from "@solana/kit";
import {
  buildClaimRewardsInstruction,
  buildTopupInstruction,
  buildUnstakeInstruction,
} from "@effectai/solana-utils";
import { executeTransaction } from "./helpers";
import { getStakeInstructionAsync, type StakeAccount } from "@effectai/stake";
import { useProfileContext } from "@/providers/ProfileContextProvider";

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

      return await executeTransaction(
        connection,
        signer,
        [claimIx],
        "confirmed",
      );
    },
    onSuccess: (_data, variables) => {
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
  const { mint } = useProfileContext();

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

      return executeTransaction(
        connection,
        signer,
        topupInstructions,
        "confirmed",
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["staking"],
      });
      queryClient.invalidateQueries({
        queryKey: ["balances"],
      });
    },
  });
};

export const useStakeMutation = () => {
  const queryClient = useQueryClient();
  const { mint } = useProfileContext();
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

      return await executeTransaction(
        connection,
        signer,
        [stakeInstruction, enterRewardPoolIx],
        "confirmed",
      );
    },
    onSuccess: (_data, variables) => {
      console.log("invalidating stake queries");
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["staking"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
};

export const useUnstakeMutation = () => {
  const queryClient = useQueryClient();
  const { mint } = useProfileContext();
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

      return await executeTransaction(
        connection,
        signer,
        unstakeIx,
        "confirmed",
      );
    },
    onSuccess: (_data, variables) => {
      console.log("invalidating unstake queries");
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
  const { mint } = useProfileContext();

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

      return await executeTransaction(
        connection,
        signer,
        claimRewardIx,
        "confirmed",
      );
    },
    onSuccess: (_data, variables) => {
      console.log("invalidating claim-reward queries");
      queryClient.invalidateQueries({ queryKey: ["staking"] });
      queryClient.invalidateQueries({
        queryKey: ["balances"],
      });
    },
  });
};
