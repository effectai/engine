import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import { EFFECT_MIGRATION_PROGRAM_ADDRESS } from "./@generated/migration";

export const deriveMigrationAccountPDA = async ({
  mint,
  foreignAddress,
}: {
  mint: Address;
  foreignAddress: Uint8Array;
}) => {
  const [migrationAccount] = await getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(mint), foreignAddress],
    programAddress: EFFECT_MIGRATION_PROGRAM_ADDRESS,
  });

  const [vaultAccount] = await getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(migrationAccount)],
    programAddress: EFFECT_MIGRATION_PROGRAM_ADDRESS,
  });

  return {
    migrationAccount,
    vaultAccount,
  };
};
