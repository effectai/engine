import { buildEddsa, buildPoseidon } from "circomlibjs";
import { randomBytes } from "crypto";
import { describe, expect, it } from "vitest";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { useAnchor } from "../helpers.js";
import { setup } from "../../utils/spl.js";

import * as snarkjs from "snarkjs";
import { PublicKey } from "@solana/web3.js";

import type { EffectPayment } from "../../target/types/effect_payment.js";

const { BN } = anchor;
const int2hex = (i) => "0x" + BigInt(i).toString(16);

describe("Payment Program", async () => {
  const program = anchor.workspace.EffectPayment as Program<EffectPayment>;
  const { provider, wallet, payer, expectAnchorError } = useAnchor();
  const authority1 = anchor.web3.Keypair.generate();
  const eddsa = await buildEddsa();

  it("can create a payment pool", async () => {
    const { mint, ata } = await setup({ payer, provider });

    const paymentAccount = anchor.web3.Keypair.generate();

    await program.methods
      .createPaymentPool(authority1.publicKey, new anchor.BN(1000))
      .accounts({
        paymentAccount: paymentAccount.publicKey,
        mint,
        userTokenAccount: ata,
      })
      .signers([paymentAccount])
      .rpc();
  });

  it("can claim multiple proofs", async () => {
    const { mint, ata } = await setup({ payer, provider, amount: 100_000_000 });

    const paymentAccount = anchor.web3.Keypair.generate();

    const poseidon = await buildPoseidon();

    // TODO: we need the manager to commit to the following
    // BabyJubjub key that he uses for signing.
    const prvKey = randomBytes(32);
    const pubKey = eddsa.prv2pub(prvKey);

    //compress publicKey
    const compressedPubKey = compressBabyJubJubPubKey(
      bigIntToBytes32(eddsa.F.toObject(pubKey[0])),
      bigIntToBytes32(eddsa.F.toObject(pubKey[1])),
    );
    const solanaPubKey = new PublicKey(compressedPubKey);

    const [recipientManagerDataAccount] =
      await anchor.web3.PublicKey.findProgramAddress(
        [payer.publicKey.toBuffer(), solanaPubKey.toBuffer()],
        program.programId,
      );

    const recentSlot = await provider.connection.getSlot("finalized");
    const [lookupTableInst, lookupTableAddress] =
      anchor.web3.AddressLookupTableProgram.createLookupTable({
        authority: payer.publicKey,
        payer: payer.publicKey,
        recentSlot,
      });

    const extendInstruction =
      anchor.web3.AddressLookupTableProgram.extendLookupTable({
        payer: payer.publicKey,
        authority: payer.publicKey,
        lookupTable: lookupTableAddress,
        addresses: [
          recipientManagerDataAccount,
          paymentAccount.publicKey,
          mint,
          ata,
        ],
      });

    await program.methods
      .init(solanaPubKey)
      .postInstructions([lookupTableInst, extendInstruction])
      .accounts({
        mint,
      })
      .rpc();

    const lookupTableAccount = (
      await provider.connection.getAddressLookupTable(lookupTableAddress)
    ).value;

    if (!lookupTableAccount) {
      throw new Error("Lookup table not found");
    }

    const batchSize = 7;
    const maxBatchSize = 40;
    const proofs = 3;

    const proofResults = [];

    for (let i = 0; i < proofs; i++) {
      const nonces = Array.from({ length: batchSize }, (value, key) =>
        int2hex(i * batchSize + key + 1),
      );

      const sigs = nonces.map((n) =>
        eddsa.signPoseidon(
          prvKey,
          poseidon([
            int2hex(n),
            int2hex(payer.publicKey.toBuffer().readBigUInt64BE()),
            int2hex(1_000_000),
          ]),
        ),
      );

      const padArray = <T>(arr: T[], defaultValue: T): T[] =>
        arr
          .concat(Array(maxBatchSize - arr.length).fill(defaultValue))
          .slice(0, maxBatchSize);

      const enabled = Array(maxBatchSize).fill(0);
      enabled.fill(1, 0, batchSize);

      const lastNonce = Math.max(...nonces.map((n) => Number(n)));

      const proofInputs = {
        receiver: int2hex(payer.publicKey.toBuffer().readBigUInt64BE()),
        pubX: eddsa.F.toObject(pubKey[0]),
        pubY: eddsa.F.toObject(pubKey[1]),
        nonce: padArray(
          nonces.map((p) => int2hex(Number(p))),
          int2hex(lastNonce),
        ),
        enabled,
        payAmount: padArray(Array(batchSize).fill(int2hex(1_000_000)), 0),
        R8x: padArray(
          sigs.map((s) => eddsa.F.toObject(s.R8[0])),
          0,
        ),
        R8y: padArray(
          sigs.map((s) => eddsa.F.toObject(s.R8[1])),
          0,
        ),
        S: padArray(
          sigs.map((s) => s.S),
          0,
        ),
      };

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        proofInputs,
        "../packages/zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
        "../packages/zkp/circuits/PaymentBatch_0001.zkey",
      );

      proofResults.push({
        proof,
        publicSignals,
      });
    }

    await program.methods
      .createPaymentPool(solanaPubKey, new anchor.BN(100_000_000))
      .accounts({
        paymentAccount: paymentAccount.publicKey,
        mint,
        userTokenAccount: ata,
      })
      .signers([paymentAccount])
      .rpc();

    const modifyCuIx = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
      units: 400_000,
    });

    const ix = await program.methods
      .claimProofs(
        bigIntToBytes32(eddsa.F.toObject(pubKey[0])),
        bigIntToBytes32(eddsa.F.toObject(pubKey[1])),
        [
          ...proofResults.map(({ proof, publicSignals }) => ({
            minNonce: Number(publicSignals[0]),
            maxNonce: Number(publicSignals[1]),
            totalAmount: Number(publicSignals[2]),
            proof: Array.from(convertProofToBytes(proof)),
          })),
        ],
      )
      .accounts({
        recipientManagerDataAccount,
        paymentAccount: paymentAccount.publicKey,
        mint,
        recipientTokenAccount: ata,
      })
      .instruction();

    const recentBlockhash = await provider.connection.getLatestBlockhash();
    const messageV0 = new anchor.web3.TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: recentBlockhash.blockhash,
      instructions: [modifyCuIx, ix],
    }).compileToV0Message([lookupTableAccount]);

    const transactionV0 = new anchor.web3.VersionedTransaction(messageV0);
    transactionV0.sign([payer]);
    const txid = await provider.connection.sendTransaction(transactionV0);

    await provider.connection.confirmTransaction(txid);

    //get token account
    const ataBalance = await provider.connection.getTokenAccountBalance(ata);
    expect(ataBalance.value.uiAmount).toBe(batchSize * proofs);
    //get nonce account
    const recipientManagerDataAccountData =
      await program.account.recipientManagerDataAccount.fetch(
        recipientManagerDataAccount,
      );
    expect(recipientManagerDataAccountData.nonce).toBe(batchSize * proofs);
  }, 40000);
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

function compressBabyJubJubPubKey(pubX, pubY) {
  if (pubX.length !== 32 || pubY.length !== 32) {
    throw new Error("Invalid input length — must be 32 bytes each");
  }

  const compressed = Uint8Array.from(pubY);
  const xSign = pubX[0] & 1;
  compressed[31] |= xSign << 7;

  return compressed;
}
