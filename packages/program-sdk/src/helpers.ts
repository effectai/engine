import {
  type Address,
  getProgramDerivedAddress,
  getAddressEncoder,
} from "@solana/kit";

export const getAssociatedTokenAccount = async ({
  owner,
  mint,
}: {
  owner: Address;
  mint: Address;
}) => {
  const addressEncoder = getAddressEncoder();

  const [pda, _bumpSeed] = await getProgramDerivedAddress({
    programAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address,
    seeds: [
      addressEncoder.encode(owner),
      addressEncoder.encode(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address,
      ),
      addressEncoder.encode(mint),
    ],
  });

  return pda;
};
