import { describe, it } from "vitest";
import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { EffectPayment } from "../../target/types/effect_payment.js";
import { useAnchor } from "../helpers.js";
import { setup } from "../../utils/spl.js";
import { BN } from "bn.js";
import { ed25519, ed25519ph, ed25519ctx, x25519 } from "@noble/curves/ed25519";
import crypto from "node:crypto";
import { Ed25519Program } from "@solana/web3.js";

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

		//get the account
		const account = await program.account.paymentAccount.fetch(
			paymentAccount.publicKey,
		);
		console.log(account);
	});

	it("can claim a payment", async () => {
		const { mint, ata } = await setup({ payer, provider });

		const paymentAccount = anchor.web3.Keypair.generate();

		await program.methods
			.createPaymentPool([authority1.publicKey], new anchor.BN(1_000_000))
			.accounts({
				paymentAccount: paymentAccount.publicKey,
				mint,
				userTokenAccount: ata,
			})
			.signers([paymentAccount])
			.rpc();

		const idBytes = Buffer.from(
			"6f4f59d3-7799-4194-9478-d713d02c1259".replace(/-/g, ""),
			"hex",
		);
		const payment = {
			id: Array.from(idBytes),
			amount: new anchor.BN(1000),
			recipientTokenAccount: ata,
			escrowAccount: paymentAccount.publicKey,
			mint,
		};

		//serialize the payment
		const paymentBuffer = Buffer.concat([
			idBytes,
			Buffer.from(payment.amount.toArrayLike(Buffer, "le", 8)),
			Buffer.from(payment.mint.toBuffer()),
			Buffer.from(payment.escrowAccount.toBuffer()),
			Buffer.from(payment.recipientTokenAccount.toBuffer()),
		]);

		//sha256 hash the payment
		const message = crypto.createHash("sha256").update(paymentBuffer).digest();
		console.log("messsage:", JSON.stringify(message.toJSON().data));

		//sign the payment with the authority 1 private key
		const signature = ed25519.sign(message, authority1.secretKey.slice(0, 32));

		const verifyIx = Ed25519Program.createInstructionWithPublicKey({
			message,
			signature: Buffer.from(signature),
			publicKey: authority1.publicKey.toBuffer(),
		});

		await program.methods
			.claim(payment, authority1.publicKey, Buffer.from(signature))
			.preInstructions([verifyIx])
			.accounts({ paymentAccount: paymentAccount.publicKey })
			.rpc();
	});
});
