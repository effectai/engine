import { buildEddsa } from "circomlibjs";
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  EFFECT_PAYMENT_PROGRAM_ADDRESS,
  generatePaymentProof,
  getClaimProofsInstructionAsync,
  getCreatePaymentPoolInstructionAsync,
  getInitInstructionAsync,
  getRecipientManagerDataAccountEncoder,
  PAYMENT_BATCH_SIZE,
  signPayment,
} from "../clients/js";

import {
  address,
  getAddressDecoder,
  generateKeyPairSigner,
  getProgramDerivedAddress,
  getAddressEncoder,
} from "@solana/kit";
import { setup } from "@effectai/test-utils";
import {
  createLocalSolanaProvider,
  executeWithSolanaProvider,
} from "@effectai/utils";
import { LiteSVM } from "litesvm";

describe("Payment Program", async () => {
  const eddsa = await buildEddsa();
  const liteSVM = new LiteSVM();
  liteSVM.addProgramFromFile(
    EFFECT_PAYMENT_PROGRAM_ADDRESS,
    "../../../target/deploy/effect_payment.so",
  );

  const managerPrivateKey = randomBytes(32);
  const eddsaPublicKey = eddsa.prv2pub(managerPrivateKey);
  const bs58ManagerPublicKey = getAddressDecoder().decode(
    eddsa.babyJub.packPoint(eddsaPublicKey),
  );

  const provider = await createLocalSolanaProvider();

  it("can redeem a proof", async () => {
    const { mint, ata, signer } = await setup();
    const paymentAccount = await generateKeyPairSigner();
    console.log(PAYMENT_BATCH_SIZE, "PAYMENT_BATCH_SIZE");

    const createPaymentPoolIx = await getCreatePaymentPoolInstructionAsync({
      mint,
      managerAuthority: bs58ManagerPublicKey,
      amount: 100n,
      paymentAccount: paymentAccount,
      userTokenAccount: ata,
      authority: signer,
    });

    const payments = Array.from(
      { length: PAYMENT_BATCH_SIZE },
      (value, key) => ({
        recipient: signer.address,
        paymentAccount: paymentAccount.address,
        id: `test-payment-${key}`,
        version: 1,
        publicKey: bs58ManagerPublicKey,
        nonce: BigInt(key + 1), // Nonce starts from 1
        amount: 1_000_000n,
      }),
    );

    console.log(
      "generating payment proof for",
      payments.length,
      "payments",
      "with manager public key",
      bs58ManagerPublicKey,
      "and signer",
      signer.address,
      "and recipient ata",
      ata,
    );
    const proof = await generatePaymentProof({
      publicKey: bs58ManagerPublicKey,
      recipient: signer.address,
      paymentAccount: paymentAccount.address,
      payments: await Promise.all(
        payments.map(async (p) => {
          return await signPayment(p, managerPrivateKey);
        }),
      ),
    });

    const initIx = await getInitInstructionAsync({
      authority: signer,
      mint,
      managerAuthority: bs58ManagerPublicKey,
    });

    const [recipientManagerDataAccount] = await getProgramDerivedAddress({
      programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
      seeds: [
        getAddressEncoder().encode(address(signer.address)),
        getAddressEncoder().encode(address(bs58ManagerPublicKey)),
      ],
    });

    const claimIx = await getClaimProofsInstructionAsync({
      authority: signer,
      paymentAccount: paymentAccount.address,
      mint,
      totalAmount: BigInt(proof.publicSignals.amount),
      pubX: bigIntToBytes32(proof.publicSignals.pubX),
      pubY: bigIntToBytes32(proof.publicSignals.pubY),
      recipientTokenAccount: ata,
      recipientManagerDataAccount,
      minNonce: Number(proof.publicSignals.minNonce),
      maxNonce: Number(proof.publicSignals.maxNonce),
      proof: convertProofToBytes(proof.proof),
    });

    try {
      await executeWithSolanaProvider({
        provider,
        signer,
        instructions: [createPaymentPoolIx, initIx, claimIx],
        commitment: "confirmed",
      });
    } catch (e) {
      console.error("Error creating payment pool:", e);
      throw e;
    }
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
