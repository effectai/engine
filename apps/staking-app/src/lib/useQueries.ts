import {
  deriveRewardAccountsPda,
  deriveStakingRewardAccountPda,
  fetchMaybeRewardAccount,
  fetchReflectionAccount,
} from "@effectai/reward";
import {
  EFFECT_VESTING_PROGRAM_ADDRESS,
  type VestingAccount,
  decodeVestingAccount,
  fetchVestingAccount,
  getActiveVestingAccountsForTokenAccount,
  deriveVestingAccountsPDA,
} from "@effectai/vesting";
import { getBase64Encoder, type Account } from "@solana/kit";
import { address as toAddress } from "@solana/kit";
import {
  decodeStakeAccount,
  fetchStakingAccountsByWalletAddress,
  EFFECT_STAKING_PROGRAM_ADDRESS,
  type StakeAccount,
} from "@effectai/stake";

export type StakeAccountDecoded = Account<StakeAccount>; // your types
import { useQuery } from "@tanstack/react-query";
import type { Connection } from "solana-kite";

import { EFFECT } from "@/lib/useEffectConfig";

export const stakingKeys = {
  stakeAccount: (owner: string | null | undefined) =>
    ["staking", "stakeAccount", owner ?? "unknown"] as const,
};

export const useEffectBalance = (
  connection: Connection,
  tokenAccount: string | null | undefined,
) => {
  const enabled = Boolean(tokenAccount && connection?.rpc);
  return useQuery({
    queryKey: ["balance", tokenAccount ?? "unknown"],
    queryFn: async ({ signal }) => {
      if (!tokenAccount || !connection) return 0;

      const balance = await connection.getTokenAccountBalance({
        tokenAccount: toAddress(tokenAccount),
      });

      return balance.uiAmount ?? 0;
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export function useStakeAccount(
  connection: Connection,
  address?: string | null,
) {
  const enabled = Boolean(address && connection?.rpc);

  return useQuery({
    queryKey: stakingKeys.stakeAccount(address ?? null),
    queryFn: async ({ signal }) => {
      if (!address || !connection) return null;

      const res = await fetchStakingAccountsByWalletAddress({
        walletAddress: address,
        rpc: connection.rpc,
        signal,
      });

      const account = res?.[0];
      if (!account) return null;

      return decodeStakeAccount({
        executable: account.account.executable,
        space: account.account.space,
        lamports: account.account.lamports,
        programAddress: EFFECT_STAKING_PROGRAM_ADDRESS,
        data: getBase64Encoder().encode(
          (account.account.data as unknown as [string, string])[0],
        ),
        address: toAddress(account.pubkey),
      });
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export const useStakingRewardAccount = (
  connection: Connection,
  stakeAccount: StakeAccountDecoded | null | undefined,
) => {
  const enabled = Boolean(stakeAccount && connection?.rpc);

  return useQuery({
    queryKey: [
      "staking",
      "rewardAccount",
      stakeAccount ? stakeAccount.address : "unknown",
    ],
    queryFn: async ({ signal }) => {
      if (!stakeAccount || !connection) return null;

      const { stakingRewardAccount } = await deriveStakingRewardAccountPda({
        stakingAccount: stakeAccount.address,
      });

      const account = await fetchMaybeRewardAccount(
        connection.rpc,
        stakingRewardAccount,
      );

      return account;
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useReflectionAccount = (connection: Connection) => {
  return useQuery({
    queryKey: ["staking", "reflection"],
    queryFn: async ({ signal }) => {
      const { reflectionAccount } = await deriveRewardAccountsPda({
        mint: toAddress(EFFECT.EFFECT_SPL_MINT),
      });

      const account = await fetchReflectionAccount(
        connection.rpc,
        reflectionAccount,
      );

      return account;
    },
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useRewardVestingAccount = (connection: Connection) => {
  return useQuery({
    queryKey: ["staking", "rewardVesting"],
    queryFn: async ({ signal }) => {
      const activeVestingAccount = import.meta.env
        .VITE_EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT;

      const account = await fetchVestingAccount(
        connection.rpc,
        toAddress(activeVestingAccount),
      );

      console.log(
        "fetched distributed vesting account",
        account.data.distributedTokens,
      );
      return account;
    },
    retry: 2,
  });
};

export const useActiveVestingAccounts = (
  connection: Connection,
  walletAddress: string | null | undefined,
) => {
  const enabled = Boolean(walletAddress && connection?.rpc);

  return useQuery({
    queryKey: ["vesting", "activeVestingAccounts", walletAddress],
    queryFn: async ({ signal }) => {
      if (!walletAddress || !connection) return [];

      const tokenAccount = await connection.getTokenAccountAddress(
        toAddress(walletAddress),
        toAddress(EFFECT.EFFECT_SPL_MINT),
      );

      const accounts = await getActiveVestingAccountsForTokenAccount({
        rpc: connection.rpc,
        tokenAccount,
      });

      return accounts.map((acc) =>
        decodeVestingAccount({
          executable: acc.account.executable,
          space: acc.account.space,
          lamports: acc.account.lamports,
          programAddress: EFFECT_VESTING_PROGRAM_ADDRESS,
          data: getBase64Encoder().encode(
            (acc.account.data as unknown as [string, string])[0],
          ),
          address: toAddress(acc.pubkey),
        }),
      );
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useGetEffectTokenAccount = (
  connection: Connection,
  walletAddress: string | null | undefined,
) => {
  const enabled = Boolean(walletAddress && connection?.rpc);

  return useQuery({
    queryKey: ["effectTokenAccount", walletAddress],
    queryFn: async ({ signal }) => {
      if (!walletAddress || !connection) return null;

      return await connection.getTokenAccountAddress(
        toAddress(walletAddress),
        toAddress(EFFECT.EFFECT_SPL_MINT),
      );
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

export const useGetVestingVaultBalance = (
  connection: Connection,
  vestingAccount: Account<VestingAccount> | null | undefined,
) => {
  const enabled = Boolean(vestingAccount && connection?.rpc);

  return useQuery({
    queryKey: [
      "staking",
      "vestingVaultBalance",
      vestingAccount?.address ?? "unknown",
    ],
    queryFn: async ({ signal }) => {
      if (!vestingAccount || !connection) return 0;

      const [vaultAddress] = await deriveVestingAccountsPDA({
        vestingAccount: vestingAccount.address,
      });

      const balance = await connection.getTokenAccountBalance({
        tokenAccount: vaultAddress,
      });

      return balance.amount ?? 0;
    },
    enabled,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
};
