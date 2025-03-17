//create dummy payments
import {
	newMemEmptyTrie,
	buildEddsa,
	buildPoseidon,
	buildBabyjub,
} from "circomlibjs";
// import * as anchor from "@coral-xyz/anchor";
import { SignedPayment } from "./payment.js";
import { ed25519 } from "@noble/curves/ed25519";
import { Ed25519PrivateKey, PrivateKey } from "@libp2p/interface";
import crypto, { randomUUID } from "node:crypto";
import { PublicKey } from "@solana/web3.js";

export const createDummyPayments = ({
	n,
	mint,
	recipient,
	paymentAccount,
	amount,
}: {
	n: number;
	amount: number;
	recipient: string;
	mint: string;
	paymentAccount: string;
}) => {
	const payments = [];
	for (let i = 0; i < n; i++) {
		const payment = Payment.encode({
			id: crypto.randomUUID(),
			amount,
			mint,
			recipient,
			nonce: BigInt(i),
			signature: "",
			paymentAccount,
		});
		payments.push(payment);
	}
	return payments.map((payment) => Payment.decode(payment));
};

export const toAnchorPayment = (payment: Payment) => {
	return {
		amount: new anchor.BN(payment.amount),
		recipientTokenAccount: new anchor.web3.PublicKey(payment.recipient),
		nonce: Number(payment.nonce),
	};
};

const int2hex = (i) => "0x" + BigInt(i).toString(16);

export const signPayment = async (
	payment: SignedPayment,
	privateKey: PrivateKey,
) => {
	const eddsa = await buildEddsa();
	const poseidon = await buildPoseidon();

	const signature = await eddsa.signPoseidon(
		privateKey.raw.slice(0, 32),
		poseidon([
			int2hex(payment.nonce),
			int2hex(new PublicKey(payment.recipient)._bn),
			int2hex(payment.amount),
		]),
	);

	console.log("signature:", signature);
	//
	// return {
	// 	message,
	// 	serializedPayment,
	// 	signature,
	// };
};

export const serializePayment = (payment: Payment) => {
	const pmnt = toAnchorPayment(payment);

	const buffer = Buffer.concat([
		Buffer.from(pmnt.amount.toArrayLike(Buffer, "le", 8)),
		Buffer.from(pmnt.recipientTokenAccount.toBuffer()),
		Buffer.from(new Uint8Array([pmnt.nonce])),
	]);

	return buffer;
};

export const hashPayment = (serializedPayment: Uint8Array) => {
	return crypto.createHash("sha256").update(serializedPayment).digest();
};
