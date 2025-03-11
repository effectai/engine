import { newMemEmptyTrie, buildEddsa, buildPoseidon, buildBabyjub } from 'circomlibjs'
import { BigNumber } from '@ethersproject/bignumber'
import { randomBytes } from 'crypto'
import { describe, it } from "vitest";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectPayment } from "../../target/types/effect_payment.js";
import { useAnchor } from "../helpers.js";
import { setup } from "../../utils/spl.js";
import { createEd25519Instruction } from "@effectai/utils";
import {
	createDummyPayments,
	signPayment,
	toAnchorPayment,
} from "@effectai/protocol";

import * as snarkjs from "snarkjs";

const { BN } = anchor;

const int2hex = (i) => '0x' + BigInt(i).toString(16);

describe("Payment Program", async () => {
	const program = anchor.workspace.EffectPayment as Program<EffectPayment>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();
	const authority1 = anchor.web3.Keypair.generate();
	const eddsa = await buildEddsa();

	// it("can create a payment pool", async () => {
	// 	const { mint, ata } = await setup({ payer, provider });

	// 	const paymentAccount = anchor.web3.Keypair.generate();

	// 	await program.methods
	// 		.createPaymentPool([authority1.publicKey], new anchor.BN(1000000000000000))
	// 		.accounts({
	// 			paymentAccount: paymentAccount.publicKey,
	// 			mint,
	// 			userTokenAccount: ata,
	// 		})
	// 		.signers([paymentAccount])
	// 		.rpc();
	// });

	it("can claim a payment", async () => {
		const { mint, ata } = await setup({ payer, provider });

		const paymentAccount = anchor.web3.Keypair.generate();

		const poseidon = await buildPoseidon();

		// TODO: we need the manager to commit to the following
		// BabyJubjub key that he uses for signing.
		const prvKey = randomBytes(32);
		const pubKey = eddsa.prv2pub(prvKey);

		const managerAddress = payer.publicKey.toBuffer();

		const batchSize = 15;

		// Generate dummy payments
		const nonces = Array.from({length: batchSize}, (value, key) => int2hex(key));
		const sigs = nonces.map((n) => eddsa.signPoseidon(prvKey, poseidon([
			int2hex(n),
			int2hex(12),
		])));

		const proofInputs = {
			pubX: eddsa.F.toObject(pubKey[0]),
    		pubY: eddsa.F.toObject(pubKey[1]),
			nonce: nonces,
			payAmount: Array(batchSize).fill(int2hex(12)),
    		R8x: sigs.map((s) => eddsa.F.toObject(s.R8[0])), 
    		R8y: sigs.map((s) => eddsa.F.toObject(s.R8[1])), 
    		S: sigs.map((s) => s.S)
		}

		const { proof, publicSignals } = await snarkjs.groth16.fullProve(
			proofInputs,
			"../zkp/circuits/PaymentBatch_js/PaymentBatch.wasm",
			"../zkp/circuits/PaymentBatch_0001.zkey"      
		)

		await program.methods
			.createPaymentPool([authority1.publicKey], new anchor.BN(10_000_000))
			.accounts({
				paymentAccount: paymentAccount.publicKey,
				mint,
				userTokenAccount: ata,
			})
			.signers([paymentAccount])
			.rpc();

		// const [payment] = createDummyPayments({
		// 	n: 1,
		// 	mint: mint.toBase58(),
		// 	recipient: ata.toBase58(),
		// 	escrowAccount: paymentAccount.publicKey.toBase58(),
		// });

		// const { signature, message } = await signPayment(
		// 	payment,
		// 	authority1.secretKey.slice(0, 32),
		// );

		// const anchorPayment = toAnchorPayment(payment);

		// const [recipientPaymentDataAccount] =
		// 	await anchor.web3.PublicKey.findProgramAddress(
		// 		[
		// 			new anchor.web3.PublicKey(payment.recipient).toBuffer(),
		// 			mint.toBuffer(),
		// 		],
		// 		program.programId,
		// 	);

		// //check if recipient paymentDataAccount exists
		// await program.methods
		// 	.init()
		// 	.accounts({
		// 		paymentAccount: paymentAccount.publicKey,
		// 		mint,
		// 		recipientTokenAccount: ata,
		// 	})
		// 	.rpc();

		// const verifyIx = createEd25519Instruction([
		// 	{
		// 		publicKey: authority1.publicKey.toBuffer(),
		// 		message: message,
		// 		signature: Buffer.from(signature),
		// 	},
		// 	{
		// 		publicKey: authority1.publicKey.toBuffer(),
		// 		message: message,
		// 		signature: Buffer.from(signature),
		// 	},
		// 	{
		// 		publicKey: authority1.publicKey.toBuffer(),
		// 		message: message,
		// 		signature: Buffer.from(signature),
		// 	},
		// 	{
		// 		publicKey: authority1.publicKey.toBuffer(),
		// 		message: message,
		// 		signature: Buffer.from(signature),
		// 	},
		// ]);

		const tx = await program.methods
			.claim(
				new BN(publicSignals[0]),
				new BN(publicSignals[1]),
				new BN(publicSignals[2]),
				bigIntToBytes32(eddsa.F.toObject(pubKey[0])),
				bigIntToBytes32(eddsa.F.toObject(pubKey[1])),
				Array.from(convertProofToBytes(proof))
			)
			.accounts({
				// recipaientPaymentDataAccount: recipientPaymentDataAccount,
				// paymentAccount: paymentAccount.publicKey,
				mint,
				// recipientTokenAccount: ata,
			})
			.rpc();
		
		// const tx = await program.methods
		// 	.claim(
		// 		managerAddress,
		// 		// eddsa.prv2pub(otherKey),
		// 		Array.from(convertProofToBytes(proof)),
		// 		authority1.publicKey,
		// 	)
		// 	.accounts({
		// 		// recipaientPaymentDataAccount: recipientPaymentDataAccount,
		// 		// paymentAccount: paymentAccount.publicKey,
		// 		// mint,
		// 		// recipientTokenAccount: ata,
		// 	})
		// 	.rpc();

        // const txDetails = await provider.connection.getTransaction(tx, {
        //     commitment: "confirmed",
        // });
        // console.log("Transaction confirmed:", !!txDetails);


		// tx.recentBlockhash = "ChUCpNSjkpodseadJzjW9RcH2APvG6GTJiAU9sDRNMjh";
		// tx.feePayer = payer.publicKey;

		// const serialized = tx.serialize({ requireAllSignatures: false });
		// console.log(serialized.byteLength);
	});

	it("can redeem mulitple payments", async () => {
		// const { mint, ata } = await setup({ payer, provider });
		// const paymentAccount = anchor.web3.Keypair.generate();
		//
		// const [payment1, payment2] = createDummyPayments({
		// 	n: 2,
		// 	mint: mint.toBase58(),
		// 	recipient: ata.toBase58(),
		// 	escrowAccount: paymentAccount.publicKey.toBase58(),
		// });
		//
		// const { signature: signature1, message: message1 } = await signPayment(
		// 	payment1,
		// 	authority1.secretKey.slice(0, 32),
		// );
		//
		// const { signature: signature2, message: message2 } = await signPayment(
		// 	payment2,
		// 	authority1.secretKey.slice(0, 32),
		// );
		//
		// const anchorPayment1 = toAnchorPayment(payment1);
		// const anchorPayment2 = toAnchorPayment(payment2);
		//
		// const [recipientPaymentDataAccount] =
		// 	await anchor.web3.PublicKey.findProgramAddress(
		// 		[ata.toBuffer(), mint.toBuffer()],
		// 		program.programId,
		// 	);
		//
		// // check if recipient paymentDataAccount exists
		// await program.methods
		// 	.init()
		// 	.accounts({
		// 		paymentAccount: paymentAccount.publicKey,
		// 		mint,
		// 		recipientTokenAccount: ata,
		// 	})
		// 	.rpc();
		//
		// const verifyIx1 = Ed25519Program.createInstructionWithPublicKey({
		// 	message: message1,
		// 	signature: Buffer.from(signature1),
		// 	publicKey: authority1.publicKey.toBuffer(),
		// });
		//
		// const verifyIx2 = Ed25519Program.createInstructionWithPublicKey({
		// 	message: message2,
		// 	signature: Buffer.from(signature2),
		// 	publicKey: authority1.publicKey.toBuffer(),
		// });
	});
});


function bigIntToBytes32(num) {
	// Convert BigInt to 32-byte hex string
	let hex = BigInt(num).toString(16);
	// Pad to 64 characters (32 bytes)
	hex = hex.padStart(64, '0');
	// Convert hex string to Uint8Array
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

function convertProofToBytes(proof: { pi_a: any[]; pi_b: any[][]; pi_c: any[]; }) {
	// Convert pi_a components
	const pi_a = [
		bigIntToBytes32(proof.pi_a[0]),
		bigIntToBytes32(proof.pi_a[1])
	];

	// Convert pi_b components (note the reversed order within pairs)
	const pi_b = [
		// First pair
		bigIntToBytes32(proof.pi_b[0][1]),  // Reversed order
		bigIntToBytes32(proof.pi_b[0][0]),
		// Second pair
		bigIntToBytes32(proof.pi_b[1][1]),  // Reversed order
		bigIntToBytes32(proof.pi_b[1][0])
	];

	// Convert pi_c components
	const pi_c = [
		bigIntToBytes32(proof.pi_c[0]),
		bigIntToBytes32(proof.pi_c[1])
	];

	// Concatenate all components
	const allBytes = concatenateUint8Arrays([
		...pi_a,
		...pi_b,
		...pi_c
	]);

	return allBytes;
}
