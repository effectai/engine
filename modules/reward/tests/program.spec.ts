import { beforeAll, describe, it } from "vitest";
import { connect } from "solana-kite";
import {
  address,
  generateKeyPairSigner,
  type KeyPairSigner,
  lamports,
} from "@solana/kit";
import { getCreateAccountInstruction } from "@solana-program/system";
import {
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
  getInitializeMintInstruction,
  getMintToCheckedInstruction,
  getCreateAssociatedTokenInstructionAsync,
} from "@solana-program/token";
import {
  getInitInstructionAsync,
  EFFECT_REWARD_PROGRAM_ADDRESS,
} from "./../clients/js/";

describe("program", () => {
  const connection = connect();

  let mint: KeyPairSigner | null = null;
  let wallet: KeyPairSigner | null = null;

  beforeAll(async () => {
    wallet = await connection.loadWalletFromFile("./.keys/test.json");
    mint = await generateKeyPairSigner();

    const rent = await connection.rpc
      .getMinimumBalanceForRentExemption(BigInt(getMintSize()))
      .send();

    const createAccountInstruction = getCreateAccountInstruction({
      payer: wallet,
      newAccount: mint,
      lamports: lamports(rent),
      space: BigInt(getMintSize()),
      programAddress: TOKEN_PROGRAM_ADDRESS,
    });

    const initializeMintInstruction = getInitializeMintInstruction({
      mint: mint.address,
      decimals: 6,
      mintAuthority: wallet.address,
    });

    const ata = await connection.getTokenAccountAddress(
      wallet.address,
      mint.address,
    );

    const createAta = await getCreateAssociatedTokenInstructionAsync({
      payer: wallet,
      owner: wallet.address,
      mint: mint.address,
    });

    const mintToInstruction = getMintToCheckedInstruction({
      decimals: 6,
      mint: mint.address,
      amount: BigInt(1_000_000_000), // 1000 tokens
      token: ata,
      mintAuthority: wallet,
    });

    //execute tx
    const tx = await connection.sendTransactionFromInstructions({
      feePayer: wallet,
      instructions: [
        createAccountInstruction,
        initializeMintInstruction,
        createAta,
        mintToInstruction,
      ],
    });
  });

  it(
    "initializes a reflection account",
    async () => {
      if (!mint) throw new Error("Mint not initialized");
      if (!wallet) throw new Error("Wallet not initialized");

      const initIx = await getInitInstructionAsync({
        scope: address("jeffCRA2yFkRbuw99fBxXaqE5GN3DwjZtmjV18McEDf"),
        authority: wallet,
        mint: mint.address,
      });

      await connection.sendTransactionFromInstructions({
        feePayer: wallet,
        instructions: [initIx],
      });
    },
    { timeout: 60000 },
  );
});
