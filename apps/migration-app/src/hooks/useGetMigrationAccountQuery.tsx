import {
  getAddressEncoder,
  getProgramDerivedAddress,
  type Address,
} from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import type { Connection } from "solana-kite";
import { fetchMaybeMigrationAccount } from "@effectai/migration";

import { EFFECT_MIGRATION_PROGRAM_ADDRESS } from "@effectai/migration";

export const useGetMigrationAccountQuery = (
  connection: Connection,
  migrationAddress: Address | null | undefined,
) => {
  const enabled = Boolean(migrationAddress && connection?.rpc);
  return useQuery({
    queryKey: ["migration-account", migrationAddress],
    queryFn: async () => {
      if (!migrationAddress || !connection) return null;
      return await fetchMaybeMigrationAccount(connection.rpc, migrationAddress);
    },
    enabled,
  });
};

export const useGetMigrationAccountVaultBalanceQuery = (
  connection: Connection,
  migrationAddress: Address | null | undefined,
) => {
  const enabled = Boolean(migrationAddress && connection?.rpc);
  return useQuery({
    queryKey: ["migration-account-vault", migrationAddress],
    queryFn: async () => {
      if (!migrationAddress || !connection) return null;

      const [vaultAccount] = await getProgramDerivedAddress({
        seeds: [getAddressEncoder().encode(migrationAddress)],
        programAddress: EFFECT_MIGRATION_PROGRAM_ADDRESS,
      });

      return connection.getTokenAccountBalance({
        tokenAccount: vaultAccount,
      });
    },
    enabled,
  });
};
