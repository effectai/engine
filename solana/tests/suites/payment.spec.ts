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

describe("Payment Program", async () => {
	const program = anchor.workspace.EffectPayment as Program<EffectPayment>;
	const { provider, wallet, payer, expectAnchorError } = useAnchor();
	const authority1 = anchor.web3.Keypair.generate();

	it("can create a payment pool", async () => {
		const { mint, ata } = await setup({ payer, provider });

		const paymentAccount = anchor.web3.Keypair.generate();

		await program.methods
			.createPaymentPool([authority1.publicKey], new anchor.BN(1000))
			.accounts({
				paymentAccount: paymentAccount.publicKey,
				mint,
				userTokenAccount: ata,
			})
			.signers([paymentAccount])
			.rpc();
	});

	it("can claim a payment", async () => {
		const { mint, ata } = await setup({ payer, provider });

		const paymentAccount = anchor.web3.Keypair.generate();

		await program.methods
			.createPaymentPool([authority1.publicKey], new anchor.BN(10_000_000))
			.accounts({
				paymentAccount: paymentAccount.publicKey,
				mint,
				userTokenAccount: ata,
			})
			.signers([paymentAccount])
			.rpc();

		const [payment] = createDummyPayments({
			n: 1,
			mint: mint.toBase58(),
			recipient: ata.toBase58(),
			escrowAccount: paymentAccount.publicKey.toBase58(),
		});

		const { signature, message } = await signPayment(
			payment,
			authority1.secretKey.slice(0, 32),
		);

		const anchorPayment = toAnchorPayment(payment);

		const [recipientPaymentDataAccount] =
			await anchor.web3.PublicKey.findProgramAddress(
				[
					new anchor.web3.PublicKey(payment.recipient).toBuffer(),
					mint.toBuffer(),
				],
				program.programId,
			);

		//check if recipient paymentDataAccount exists
		await program.methods
			.init()
			.accounts({
				paymentAccount: paymentAccount.publicKey,
				mint,
				recipientTokenAccount: ata,
			})
			.rpc();

		const verifyIx = createEd25519Instruction([
			{
				publicKey: authority1.publicKey.toBuffer(),
				message: message,
				signature: Buffer.from(signature),
			},
			{
				publicKey: authority1.publicKey.toBuffer(),
				message: message,
				signature: Buffer.from(signature),
			},
			{
				publicKey: authority1.publicKey.toBuffer(),
				message: message,
				signature: Buffer.from(signature),
			},
			{
				publicKey: authority1.publicKey.toBuffer(),
				message: message,
				signature: Buffer.from(signature),
			},
		]);

		console.log(verifyIx.data.byteLength);

		const tx = await program.methods
			.claim(
				[anchorPayment, anchorPayment, anchorPayment, anchorPayment],
				authority1.publicKey,
			)
			.preInstructions([verifyIx])
			.accounts({
				recipientPaymentDataAccount: recipientPaymentDataAccount,
				paymentAccount: paymentAccount.publicKey,
				mint,
				recipientTokenAccount: ata,
			})
			.transaction();

		tx.recentBlockhash = "ChUCpNSjkpodseadJzjW9RcH2APvG6GTJiAU9sDRNMjh";
		tx.feePayer = payer.publicKey;

		const serialized = tx.serialize({ requireAllSignatures: false });
		console.log(serialized.byteLength);
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
