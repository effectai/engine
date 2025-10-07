import fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

const BATCH_SIZE = process.env.PAYMENT_BATCH_SIZE || 50;
console.log("🔧 Generating PaymentBatch circuit with batch size:", BATCH_SIZE);

const template = `
pragma circom 2.0.0;

include "./Payment.circom";
include "../node_modules/circomlib/circuits/pointbits.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template VerifyPaymentBatch(n) {
    signal output minNonce;
    signal output maxNonce;
    signal output totalAmount;

    signal input receiver;
    signal input paymentAccount;
    signal input strategy;
    signal input version;

    signal input pubX;
    signal input pubY;

    signal input payAmount[n];
    signal input nonce[n];

    signal input R8x[n];
    signal input R8y[n];
    signal input S[n];

    signal input enabled[n];

    component payVerifier[n];
    component nonceChecker[n-1];

    var min = nonce[0];
    var max = nonce[n-1];

    signal total[n+1];
    total[0] <== 0;

    for (var i = 0; i < n; i++) {
	payVerifier[i] = VerifyPayment();
	payVerifier[i].enabled <== enabled[i];
	payVerifier[i].payAmount <== payAmount[i];
	payVerifier[i].nonce <== nonce[i];
	payVerifier[i].receiver <== receiver;
	payVerifier[i].strategy <== strategy;
	payVerifier[i].version <== version;
	payVerifier[i].paymentAccount <== paymentAccount;
	payVerifier[i].pubX <== pubX;
	payVerifier[i].pubY <== pubY;
	payVerifier[i].R8x <== R8x[i];
	payVerifier[i].R8y <== R8y[i];
	payVerifier[i].S <== S[i];

	// We are forcing nonces to be incremental for ease
	if (i > 0) {
	    nonceChecker[i-1] = LessThan(32);
	    nonceChecker[i-1].in[0] <== nonce[i-1];
	    nonceChecker[i-1].in[1] <== nonce[i];
	    nonceChecker[i-1].out === enabled[i];
	}

	total[i+1] <== total[i] + payAmount[i];
    }

    minNonce <== min;
    maxNonce <== max;
    totalAmount <== total[n];
}

component main {public [pubX, pubY, receiver, paymentAccount, strategy, version]} = VerifyPaymentBatch(${BATCH_SIZE});
`;

fs.writeFileSync("./circuits/PaymentBatch.circom", template);

console.log("✅ Circuit generated with batch size:", BATCH_SIZE);
