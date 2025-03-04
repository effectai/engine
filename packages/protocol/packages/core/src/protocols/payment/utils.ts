//create dummy payments

import * as anchor from "@coral-xyz/anchor";
import { Payment } from "./pb/payment.js";
import { ed25519 } from "@noble/curves/ed25519";
import { Ed25519PrivateKey } from "@libp2p/interface";
import crypto, { randomUUID } from "node:crypto";

export const createDummyPayments = ({
	n,
	mint,
	recipient,
	escrowAccount,
}: {
	n: number;
	recipient: string;
	mint: string;
	escrowAccount: string;
}) => {
	const payments = [];
	for (let i = 0; i < n; i++) {
		const payment = Payment.encode({
			id: crypto.randomUUID(),
			amount: 100,
			mint,
			recipient,
			nonce: BigInt(1),
			signature: "",
			escrowAccount,
		});
		payments.push(payment);
	}
	return payments.map((payment) => Payment.decode(payment));
};

export const toAnchorPayment = (payment: Payment) => {
	const idBytes = Buffer.from(payment.id.replace(/-/g, ""), "hex");

	return {
		id: Array.from(idBytes),
		amount: new anchor.BN(payment.amount),
		recipientTokenAccount: new anchor.web3.PublicKey(payment.recipient),
		nonce: Number(payment.nonce),
	};
};

export const signPayment = async (payment: Payment, authority: Uint8Array) => {
	const serializedPayment = serializePayment(payment);
	const message = hashPayment(serializedPayment);
	const signature = ed25519.sign(message, authority);

	return {
		message,
		payment,
		signature,
	};
};

export const serializePayment = (payment: Payment) => {
	const pmnt = toAnchorPayment(payment);

	const buffer = Buffer.concat([
		Buffer.from(pmnt.id),
		Buffer.from(pmnt.amount.toArrayLike(Buffer, "le", 8)),
		Buffer.from(pmnt.recipientTokenAccount.toBuffer()),
		Buffer.from(new Uint8Array([pmnt.nonce])),
	]);

	console.log("buffer size", buffer.length);
	return buffer;
};

export const hashPayment = (serializedPayment: Buffer) => {
	return crypto.createHash("sha256").update(serializedPayment).digest();
};
