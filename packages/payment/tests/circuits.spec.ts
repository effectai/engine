import { describe, it, expect } from "vitest";

import bs58 from "bs58";
import {
  generatePaymentProof,
  intStringTo32Bytes,
  prove,
  signPayment,
} from "../clients/js";
import { publicKeyToTruncatedHex } from "../clients/js";
import { randomBytes } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import { buildEddsa } from "circomlibjs";

import { setup } from "@effectai/test-utils";
import { generateKeyPairSigner } from "@solana/kit";

describe("Generate Proof", () => {
  it("should generate and prove a proof", async () => {
    const privateKeyBytes = randomBytes(32);

    const eddsa = await buildEddsa();

    const uPublicKey = eddsa.prv2pub(privateKeyBytes);
    const publicKey = eddsa.babyJub.packPoint(uPublicKey);

    const recipient = new PublicKey(Uint8Array.from(randomBytes(32)));
    const paymentAccount = new PublicKey(
      "6vzTknzXCrdCXRWEJDWjJ9ZLGDMNUEtKCgc8TnZYTZv8",
    );

    const payments = [
      {
        id: "test-payment-1",
        version: 1,
        publicKey: bs58.encode(publicKey),
        nonce: 1n,
        amount: 1000n,
        recipient: recipient.toString(),
        paymentAccount: paymentAccount.toString(),
      },
    ];

    // sign payments
    const signedPayments = await Promise.all(
      payments.map(async (payment) => {
        return await signPayment(payment, privateKeyBytes);
      }),
    );

    const proofResult = await generatePaymentProof({
      recipient: recipient.toString(),
      publicKey: bs58.encode(publicKey),
      paymentAccount: paymentAccount.toString(),
      payments: signedPayments,
    });

    expect(proofResult).toBeDefined();

    // prove the proof is valid
    const isValid = await prove({
      proof: proofResult.proof,
      publicSignals: proofResult.publicSignals,
    });

    expect(isValid).toBe(true);

    //expect truncated public key to be the same as the one in public signal
    const truncatedPaymentAccount = publicKeyToTruncatedHex(
      new PublicKey(paymentAccount),
    );
    const decimalString = BigInt(truncatedPaymentAccount).toString(10);
    expect(decimalString).toEqual(proofResult.publicSignals.paymentAccount);

    expect(
      intStringTo32Bytes(proofResult.publicSignals.paymentAccount),
    ).toEqual(paymentAccount.toBytes());

    const truncatedRecipient = publicKeyToTruncatedHex(
      new PublicKey(recipient),
    );
    const decimalStringRecipient = BigInt(truncatedRecipient).toString(10);
    expect(decimalStringRecipient).toEqual(proofResult.publicSignals.recipient);
  });
});
