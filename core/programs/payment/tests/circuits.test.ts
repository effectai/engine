import {
  generateKeyPairSigner,
  getAddressDecoder,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";
import { buildEddsa } from "circomlibjs";
import { randomBytes } from "node:crypto";
import { expect, test } from "vitest";
import {
  EFFECT_PAYMENT_PROGRAM_ADDRESS,
  generatePaymentProof,
  PayoutStrategy,
  signPayment,
} from "./../clients/js/node";

test(
  "generates proofs",
  async () => {
    //generate manager keypair
    const privateKeyBytes = randomBytes(32);
    const eddsa = await buildEddsa();
    const uPublicKey = eddsa.prv2pub(privateKeyBytes);
    const publicKey = eddsa.babyJub.packPoint(uPublicKey);
    const managerPublicKey = getAddressDecoder().decode(publicKey);
    const mint = await generateKeyPairSigner();
    const recipient = await generateKeyPairSigner();
    const wallet = await generateKeyPairSigner();

    //generate application & stake account
    const applicationAccount = await generateKeyPairSigner();

    //derive our Payment Account
    const [paymentAccount] = await getProgramDerivedAddress({
      programAddress: EFFECT_PAYMENT_PROGRAM_ADDRESS,
      seeds: [
        Buffer.from("payment", "utf-8"),
        getAddressEncoder().encode(managerPublicKey),
        getAddressEncoder().encode(applicationAccount.address),
        getAddressEncoder().encode(mint.address),
      ],
    });

    //generate 10 dummy payments
    const payments = Array.from({ length: 10 }, (_, i) => ({
      id: `test-payment-${i + 1}`,
      version: 1,
      strategy: PayoutStrategy.Staked,
      publicKey: managerPublicKey,
      nonce: BigInt(i + 1),
      paymentAccount: paymentAccount.toString(),
      amount: 1_000_000n,
      recipient: wallet.address.toString(),
    }));

    // sign payments
    const signedPayments = await Promise.all(
      payments.map(async (payment) => {
        return await signPayment(payment, privateKeyBytes);
      }),
    );

    //generate our proof
    const proofResult = await generatePaymentProof({
      version: 1,
      strategy: PayoutStrategy.Staked,
      recipient: wallet.address.toString(),
      publicKey: managerPublicKey,
      paymentAccount: paymentAccount.toString(),
      payments: signedPayments,
    });

    expect(proofResult).toBeDefined();
  },
  { timeout: 20_000 },
);
