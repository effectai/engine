//create dummy payments
import { buildEddsa, buildPoseidon } from "circomlibjs";

import crypto from "node:crypto";
import type { PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { int2hex } from "../utils/utils.js";
import type { Payment } from "./payment.js";

export const signPayment = async (payment: Payment, privateKey: PrivateKey) => {
	const eddsa = await buildEddsa();
	const poseidon = await buildPoseidon();

	const signature = await eddsa.signPoseidon(
		privateKey.raw.slice(0, 32),
		poseidon([
			int2hex(payment.nonce),
			int2hex(new PublicKey(payment.recipient).toString()),
			int2hex(payment.amount),
		]),
	);

	return signature;
};

export const hashPayment = (serializedPayment: Uint8Array) => {
	return crypto.createHash("sha256").update(serializedPayment).digest();
};
