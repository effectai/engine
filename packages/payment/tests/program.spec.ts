import { buildEddsa } from "circomlibjs";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import * as anchor from "@coral-xyz/anchor";
import {
  generatePaymentProof,
  getCreatePaymentPoolInstructionAsync,
  PAYMENT_BATCH_SIZE,
  signPayment,
} from "../clients/js";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { address, getAddressDecoder, generateKeyPairSigner } from "@solana/kit";
import { setup } from "@effectai/test-utils";
import {
  createLocalSolanaProvider,
  executeWithSolanaProvider,
} from "@effectai/utils";

const { BN } = anchor;

describe("Payment Program", async () => {
  const eddsa = await buildEddsa();

  const managerPrivateKey = randomBytes(32);
  const eddsaPublicKey = eddsa.prv2pub(managerPrivateKey);
  const bs58ManagerPublicKey = getAddressDecoder().decode(
    eddsa.babyJub.packPoint(eddsaPublicKey),
  );
  const provider = await createLocalSolanaProvider();

  it("can create a payment pool", async () => {
    const { mint, ata, signer } = await setup();

    const paymentAccount = await generateKeyPairSigner();

    const ix = await getCreatePaymentPoolInstructionAsync({
      mint,
      managerAuthority: bs58ManagerPublicKey,
      amount: 500n,
      paymentAccount: paymentAccount,
      userTokenAccount: ata,
      authority: signer,
    });

    await executeWithSolanaProvider({
      provider,
      signer,
      instructions: [ix],
    });
  });

  it("can claim a proof", async () => {
    const { mint, ata } = await setup({ payer, provider, amount: 100_000_000 });

    const paymentAccount = anchor.web3.Keypair.generate();

    const [recipientManagerDataAccount] =
      await anchor.web3.PublicKey.findProgramAddress(
        [payer.publicKey.toBuffer(), solanaPubKey.toBuffer()],
        program.programId,
      );

    const batchSize = PAYMENT_BATCH_SIZE;

    const payments = Array.from({ length: batchSize }, (value, key) => ({
      recipient: payer.publicKey.toBase58(),
      paymentAccount: paymentAccount.publicKey.toBase58(),
      id: `test-payment-${key}`,
      version: 1,
      publicKey: solanaPubKey.toBase58(),
      nonce: BigInt(key + 1), // Nonce starts from 1
      amount: 1_000_000n,
    }));

    const { proof, publicSignals } = await generatePaymentProof({
      publicKey: solanaPubKey.toBase58(),
      recipient: payer.publicKey.toBase58(),
      paymentAccount: paymentAccount.publicKey.toBase58(),
      payments: await Promise.all(
        payments.map(async (p) => {
          return await signPayment(p, prvKey);
        }),
      ),
    });

    // generate data account.
    await program.methods
      .init(solanaPubKey)
      .accounts({
        authority: payer.publicKey,
        mint,
      })
      .rpc();

    await program.methods
      .createPaymentPool(solanaPubKey, new anchor.BN(100_000_000))
      .accounts({
        paymentAccount: paymentAccount.publicKey,
        mint,
        userTokenAccount: ata,
      })
      .signers([paymentAccount])
      .rpc();

    const budgetIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 500_000,
    });

    const tx = await program.methods
      .claimProofs(
        Array.from(bigIntToBytes32(eddsa.F.toObject(pubKey[0]))),
        Array.from(bigIntToBytes32(eddsa.F.toObject(pubKey[1]))),
        Number(publicSignals.minNonce),
        Number(publicSignals.maxNonce),
        new BN(publicSignals.amount),
        Array.from(convertProofToBytes(proof)),
      )
      .preInstructions([budgetIx])
      .accounts({
        recipientManagerDataAccount,
        paymentAccount: paymentAccount.publicKey,
        mint,
        recipientTokenAccount: ata,
      })
      .rpc();

    //get token account
    const ataBalance = await provider.connection.getTokenAccountBalance(ata);
    expect(ataBalance.value.uiAmount).toBe(batchSize);

    //get data account
    const recipientManagerDataAccountData =
      await program.account.recipientManagerDataAccount.fetch(
        recipientManagerDataAccount,
      );
    expect(recipientManagerDataAccountData.nonce).toBe(batchSize); // Nonce should be batchSize + 1 since we started from 1
  }, 60000);
});

function bigIntToBytes32(num) {
  let hex = BigInt(num).toString(16);

  hex = hex.padStart(64, "0");

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, (i + 1) * 2), 16);
  }

  return bytes;
}

function concatenateUint8Arrays(arrays) {
  // Calculate total length
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  // Create new array with total length
  const result = new Uint8Array(totalLength);
  // Copy each array into result
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function convertProofToBytes(proof: {
  pi_a: any[];
  pi_b: any[][];
  pi_c: any[];
}) {
  // Convert pi_a components
  const pi_a = [bigIntToBytes32(proof.pi_a[0]), bigIntToBytes32(proof.pi_a[1])];

  // Convert pi_b components (note the reversed order within pairs)
  const pi_b = [
    // First pair
    bigIntToBytes32(proof.pi_b[0][1]), // Reversed order
    bigIntToBytes32(proof.pi_b[0][0]),
    // Second pair
    bigIntToBytes32(proof.pi_b[1][1]), // Reversed order
    bigIntToBytes32(proof.pi_b[1][0]),
  ];

  // Convert pi_c components
  const pi_c = [bigIntToBytes32(proof.pi_c[0]), bigIntToBytes32(proof.pi_c[1])];

  // Concatenate all components
  const allBytes = concatenateUint8Arrays([...pi_a, ...pi_b, ...pi_c]);

  return allBytes;
}
