import {
  getInitializeMintInstruction,
  getCreateAssociatedTokenInstructionAsync,
  getMintToCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
  getMintSize,
} from "@solana-program/token";

import { getCreateAccountInstruction } from "@solana-program/system";
import type { Connection } from "solana-kite";
import {
  type Address,
  generateKeyPairSigner,
  type KeyPairSigner,
  lamports,
} from "@solana/kit";

export type SetupReturn = {
  mint: Address;
  ata: Address;
};

export const setup = async (
  connection: Connection,
  signer: KeyPairSigner,
): Promise<SetupReturn> => {
  const mint = await generateKeyPairSigner();

  const rent = await connection.rpc
    .getMinimumBalanceForRentExemption(BigInt(getMintSize()))
    .send();

  const createAccountInstruction = getCreateAccountInstruction({
    payer: signer,
    newAccount: mint,
    lamports: lamports(rent),
    space: BigInt(getMintSize()),
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintInstruction = getInitializeMintInstruction({
    mint: mint.address,
    decimals: 6,
    mintAuthority: signer.address,
  });

  const ata = await connection.getTokenAccountAddress(
    signer.address,
    mint.address,
  );

  const createAta = await getCreateAssociatedTokenInstructionAsync({
    payer: signer,
    owner: signer.address,
    mint: mint.address,
  });

  const mintToInstruction = getMintToCheckedInstruction({
    decimals: 6,
    mint: mint.address,
    amount: BigInt(1_000_000_000), // 1000 tokens
    token: ata,
    mintAuthority: signer,
  });

  //execute tx
  await connection.sendTransactionFromInstructions({
    feePayer: signer,
    instructions: [
      createAccountInstruction,
      initializeMintInstruction,
      createAta,
      mintToInstruction,
    ],
  });

  return { mint: mint.address, ata };
};
