pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/eddsaposeidon.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";

template VerifyPayment() {

    signal input payAmount;
    signal input nonce;
    signal input receiver;
    signal input paymentAccount;
    signal input version;
    signal input strategy;
    signal input enabled;

    signal input pubX;
    signal input pubY;
    signal input R8x;
    signal input R8y;
    signal input S;

    component P = Poseidon(6);
    P.inputs[0] <== version;
    P.inputs[1] <== strategy;
    P.inputs[2] <== nonce;
    P.inputs[3] <== receiver;
    P.inputs[4] <== paymentAccount;
    P.inputs[5] <== payAmount;

    component verifier = EdDSAPoseidonVerifier();
    verifier.enabled <== enabled;
    verifier.Ax <== pubX;
    verifier.Ay <== pubY;
    verifier.R8x <== R8x;
    verifier.R8y <== R8y;
    verifier.S <== S;
    verifier.M <== P.out;

}
