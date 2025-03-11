pragma circom 2.0.0;

/* This circuit multiplies two numbers and checks that the result is correct. */

template Multiply2Numbers() {

    // Declaration of signals
    signal input a;
    signal input b;
    signal output c;

    //Constraints
    c <== a * b;
}

component main = Multiply2Numbers();