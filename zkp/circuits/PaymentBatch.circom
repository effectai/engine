pragma circom 2.0.0;

include "./Payment.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template VerifyPaymentBatch(n) {
    signal output minNonce;
    signal output maxNonce;
    signal output totalAmount;

    // TODO: make receiver a public signal, so we can check it in the
    // solana program
    signal input receiver;

    signal input pubX;
    signal input pubY;

    signal input payAmount[n];
    signal input nonce[n];

    signal input R8x[n];
    signal input R8y[n];
    signal input S[n];

    component payVerifier[n];
    component nonceChecker[n-1];

    var min = nonce[0];
    var max = nonce[n-1];

    signal total[n+1];
    total[0] <== 0;

    for (var i = 0; i < n; i++) {
	payVerifier[i] = VerifyPayment();
	payVerifier[i].payAmount <== payAmount[i];
	payVerifier[i].nonce <== nonce[i];
	payVerifier[i].receiver <== receiver;
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
	    nonceChecker[i-1].out === 1;
	}

	total[i+1] <== total[i] + payAmount[i];
    }

    minNonce <== min;
    maxNonce <== max;
    totalAmount <== total[n];
}

component main {public [pubX, pubY]} = VerifyPaymentBatch(60);