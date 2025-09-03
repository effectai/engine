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
import { getBase64Encoder, type Account, type Address } from "@solana/kit";
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
import { useProfileContext } from "@/providers/ProfileContextProvider";

export const stakingKeys = {
  stakeAccount: (owner: string | null | undefined) =>
    ["staking", "stakeAccount", owner ?? "unknown"] as const,
};

export const useGetLamports = (
  connection: Connection,
  address: string | null | undefined,
) => {
  const enabled = Boolean(address && connection?.rpc);
  return useQuery({
    queryKey: ["balances", address, "lamports", { scope: "balance" }],
    queryFn: async ({ signal }) => {
      if (!address || !connection) return null;
      return await connection.getLamportBalance(address);
    },
    enabled,
  });
};

export const useEffectBalance = (
  connection: Connection,
  tokenAccount: string | null | undefined,
) => {
  const enabled = Boolean(tokenAccount && connection?.rpc);
  return useQuery({
    queryKey: ["balances", tokenAccount ?? "unknown", { scope: "balance" }],
    queryFn: async ({ signal }) => {
      if (!tokenAccount || !connection) return null;

      return await connection.getTokenAccountBalance({
        tokenAccount: toAddress(tokenAccount),
      });
    },
    enabled,
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
  });
}

export const useStakingRewardAccount = (
  connection: Connection | null,
  stakeAccount: StakeAccountDecoded | null | undefined,
) => {
  const enabled = Boolean(stakeAccount && connection?.rpc);

  return useQuery({
    queryKey: ["staking", "rewardAccount", stakeAccount?.address],
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
  });
};

export const useReflectionAccount = (connection: Connection | null) => {
  const enabled = Boolean(connection?.rpc);
  const { mint } = useProfileContext();

  return useQuery({
    queryKey: ["staking", "reflection"],
    queryFn: async ({ signal }) => {
      if (!connection) return null;

      const { reflectionAccount } = await deriveRewardAccountsPda({
        mint,
      });

      const account = await fetchReflectionAccount(
        connection.rpc,
        reflectionAccount,
      );

      return account;
    },
    enabled,
  });
};

export const useRewardVestingAccount = (connection: Connection | null) => {
  const enabled = Boolean(connection?.rpc);

  return useQuery({
    queryKey: ["staking", "rewardVesting"],
    queryFn: async ({ signal }) => {
      if (!connection) return null;
      const activeVestingAccount = import.meta.env
        .VITE_EFFECT_ACTIVE_REWARD_VESTING_ACCOUNT;

      const account = await fetchVestingAccount(
        connection?.rpc,
        toAddress(activeVestingAccount),
      );

      return account;
    },
    enabled,
  });
};

export const useActiveVestingAccounts = (
  connection: Connection | null,
  walletAddress: string | null | undefined,
) => {
  const enabled = Boolean(walletAddress && connection?.rpc);
  const { mint } = useProfileContext();

  return useQuery({
    queryKey: ["vesting", "activeVestingAccounts", walletAddress],
    queryFn: async ({ signal }) => {
      if (!walletAddress || !connection) return [];

      const tokenAccount = await connection.getTokenAccountAddress(
        toAddress(walletAddress),
        mint,
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
  });
};

export const useGetEffectTokenAccount = (
  connection: Connection | null,
  walletAddress: string | null | undefined,
) => {
  const enabled = Boolean(walletAddress && connection?.rpc);
  const { mint } = useProfileContext();

  return useQuery({
    queryKey: ["effectTokenAccount", walletAddress],
    queryFn: async ({ signal }) => {
      if (!walletAddress || !connection) return null;

      return await connection.getTokenAccountAddress(
        toAddress(walletAddress),
        mint,
      );
    },
    enabled,
  });
};

export const useGetInterMediaryRewardVaultBalance = (
  connection: Connection | null,
) => {
  const enabled = Boolean(connection?.rpc);
  const { mint } = useProfileContext();

  return useQuery({
    queryKey: ["staking", "intermediaryRewardVaultBalance"],
    queryFn: async ({ signal }) => {
      if (!connection) return null;

      const { intermediaryReflectionVaultAccount } =
        await deriveRewardAccountsPda({
          mint,
        });

      const balance = await connection.getTokenAccountBalance({
        tokenAccount: intermediaryReflectionVaultAccount,
      });

      return balance;
    },
    enabled,
  });
};

export const useGetVestingVaultBalance = (
  connection: Connection | null,
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
      if (!vestingAccount || !connection) return null;

      const [vaultAddress] = await deriveVestingAccountsPDA({
        vestingAccount: vestingAccount.address,
      });

      const balance = await connection.getTokenAccountBalance({
        tokenAccount: vaultAddress,
      });

      return balance;
    },
    enabled,
  });
};
