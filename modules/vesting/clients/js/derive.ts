import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import { EFFECT_VESTING_PROGRAM_ADDRESS } from "./@generated/vesting";

export const deriveVestingAccountsPDA = ({
  vestingAccount,
}: {
  vestingAccount: Address;
}) => {
  return getProgramDerivedAddress({
    seeds: [getAddressEncoder().encode(vestingAccount)],
    programAddress: EFFECT_VESTING_PROGRAM_ADDRESS,
  });
};
