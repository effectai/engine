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
	const idBytes = Buffer.from(payment.id.replace(/-/g, ""), "hex");

	return {
		id: Array.from(idBytes),
		amount: new anchor.BN(payment.amount),
		recipientTokenAccount: new anchor.web3.PublicKey(payment.recipient),
		nonce: Number(payment.nonce),
	};
};

export const signPayment = async (payment: Payment, authority: Uint8Array) => {
	const serializedPayment = Payment.encode(payment);
	const message = hashPayment(serializedPayment);
	const signature = ed25519.sign(message, authority);

	return {
		message,
		serializedPayment,
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

	return buffer;
};

export const hashPayment = (serializedPayment: Uint8Array) => {
	return crypto.createHash("sha256").update(serializedPayment).digest();
};
