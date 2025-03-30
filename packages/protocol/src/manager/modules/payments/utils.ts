//create dummy payments
import { buildEddsa, buildPoseidon } from "circomlibjs";

import type { PrivateKey } from "@libp2p/interface";
import { PublicKey } from "@solana/web3.js";
import { int2hex } from "../../../utils/utils.js";

export const signPayment = async (payment: Payment, privateKey: PrivateKey) => {
	const eddsa = await buildEddsa();
	const poseidon = await buildPoseidon();

	const signature = eddsa.signPoseidon(
		privateKey.raw.slice(0, 32),
		poseidon([
			int2hex(payment.nonce),
			int2hex(new PublicKey(payment.recipient).toBuffer().readBigInt64BE()),
			int2hex(payment.amount),
		]),
	);

	return signature;
};
