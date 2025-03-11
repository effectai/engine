pragma circom 2.0.0;

include "./Payment.circom";
include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template VerifyPaymentBatch() {
    signal output minNonce <== 1;
    signal output maxNonce <== 12;

    signal input payAmount;
    signal input nonce;

    signal input pubX;
    signal input pubY;
    signal input R8x;
    signal input R8y;
    signal input S;
    
    component payVerifier = VerifyPayment();
    payVerifier.payAmount <== payAmount;
    payVerifier.nonce <== nonce;
    payVerifier.pubX <== pubX;
    payVerifier.pubY <== pubY;
    payVerifier.R8x <== R8x;
    payVerifier.R8y <== R8y;
    payVerifier.S <== S;                        
}

component main {public [pubX, pubY]} = VerifyPaymentBatch();