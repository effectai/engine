import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import { EFFECT_MIGRATION_PROGRAM_ADDRESS } from "./@generated/migration";

export const deriveMigrationAccountPDA = ({
  mint,
  foreignAddress,
}: {
  mint: Address;
  foreignAddress: Uint8Array;
}) => {
  return getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(mint), foreignAddress],
    programAddress: EFFECT_MIGRATION_PROGRAM_ADDRESS,
  });
};
