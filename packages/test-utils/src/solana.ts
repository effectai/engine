import {
  Address,
  appendTransactionMessageInstructions,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  KeyPairSigner,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";

import {
  getInitializeMintInstruction,
  getCreateAssociatedTokenInstructionAsync,
  getMintToCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
  getMintSize,
} from "@solana-program/token";

import { getCreateAccountInstruction } from "@solana-program/system";

import { getAssociatedTokenAccount } from "@effectai/utils";
import { loadKeypairSigner } from "../../utils/dist/solana";

import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type SetupReturn = {
  rpc: ReturnType<typeof createSolanaRpc>;
  sendAndConfirmTransaction: ReturnType<
    typeof sendAndConfirmTransactionFactory
  >;
  signer: KeyPairSigner;
  mint: Address;
  ata: Address;
};

export const setup = async (): Promise<SetupReturn> => {
  // Load our local testing keypair
  const signer = await loadKeypairSigner(
    `${__dirname}/../../../tests/keys/authGiAp86YEPGjqpKNxAMHxqcgvjmBfQkqqvhf7yMV.json`,
  );

  const mint = await generateKeyPairSigner();
  const rpc = createSolanaRpc("http://127.0.0.1:8899");
  const rpcSubscriptions = createSolanaRpcSubscriptions("ws://localhost:8900");

  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const account = await getAssociatedTokenAccount({
    owner: signer.address,
    mint: mint.address,
  });

  // figure out the rent-exempt minimum balance for a mint account
  const lamports = await rpc
    .getMinimumBalanceForRentExemption(BigInt(getMintSize()))
    .send();

  const createMintAccountIx = getCreateAccountInstruction({
    payer: signer,
    space: getMintSize(),
    lamports,
    newAccount: mint,
    programAddress: TOKEN_PROGRAM_ADDRESS,
  });

  const initializeMintIx = getInitializeMintInstruction({
    mint: mint.address,
    mintAuthority: signer.address,
    decimals: 6,
  });

  const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
    mint: mint.address,
    owner: signer.address,
    payer: signer,
  });

  const mintToIx = getMintToCheckedInstruction({
    decimals: 6,
    token: account,
    mint: mint.address,
    amount: 100_000_000_000n, // 100 000 tokens with 6 decimals
    mintAuthority: signer,
  });

  const recentBlockhash = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) =>
      setTransactionMessageLifetimeUsingBlockhash(recentBlockhash.value, tx),
    (tx) =>
      appendTransactionMessageInstructions(
        [createMintAccountIx, initializeMintIx, createAtaIx, mintToIx],
        tx,
      ),
  );

  const result = await signTransactionMessageWithSigners(transactionMessage);

  await sendAndConfirmTransaction(result, { commitment: "confirmed" });

  return {
    mint: mint.address,
    rpc,
    sendAndConfirmTransaction,
    signer,
    ata: account,
  };
};
