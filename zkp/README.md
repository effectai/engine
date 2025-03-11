# Snark payments for Effect

## Dependencies

Install the following

- Circom
- curl (for downloading cached ptau, see below)

## Makefile

All steps of the circuit and key generation are detailed in the
[Makefile](../Makefile). The Makefile expects to find `node`, `pnpm`,
and `circom` on the path, but these can be overwritten with
environment variables.


## Ceremony Phase 1

We are currently using a trusted setup usings powers of tau of size
2^19. Generating the `ptau` file can take hours, so before making the
circuits and proving keys it is recommended to download a
pre-generated `pot19_final.ptau` file (which is around 600MB).

1. [Download (Google Drive, 600MB)](https://drive.google.com/file/d/19fUwW1jIyYtQAsNbX8uk3hmYJ1fg79ux/view?usp=drive_link)
2. Move the file to `zkp/setup/pot19_final.ptau`

If you want to run the Phase 1 ceremony yourself, you can invoke it
with:

```
make zkp/setup/pot19_final.ptau
```

Or run a smaller ceremony with:

```
TAU_SIZE=12 make zkp/setup/pot${TAU_SIZE}_final.ptau
```

The goal of larger tau ceremony is to have larger payment batch sizes.

## Building the circuits

The main circuit is called PaymentBatch and is located in
[zkp/circuits/Paymentatch.circom](zkp/circuits/Paymentatch.circom).

Make sure to adjust the `(60)` on the last line to reflect the batch
size you want. For a 2^12 tau size that is around 5.

Compile the circuit with:

```
make PaymentBatch.r1cs
```

This will generate:

- `zkp/circtuis/PaymentBatch.r1cs`: needed to generate proving and
  verifying keys in Phase 2 of the ceremony
- `zkp/circtuis/PaymentBatch_js/PaymentBatch.wasm`: needed to
  genenrate proofs using the client using snarkjs
  
## Ceremony Phase 2

The last part of the ceremony is done with:

```
make zkp/circuits/PaymentBatch_0001.zkey
```

This `zkey` file is the proving key required byt the client to
generate proofs in snarkjs.

## Verification Key

We can now export the verification key. As the verification step will
be executed in a Solana program, the key must be exported to a rust
file, which is done by the
[verification_to_rust.cjs](verification_to_rust.cjs) script. This file
must be placed in the
[../solana/programs/effect-payment/program/src](../solana/programs/effect-payment/program/src)
folder. These 3 steps are executed by the Makefile:

```
make solana/programs/effect-payment/program/src/verifying_key.rs
```

## Alternative: quick start

The quickest to get started, is do a small ceremony yourself and let
the Makefile do all the work:

```
export TAU_SIZE=12
make solana/programs/effect-payment/program/src/verifying_key.rs
```

This should take a few minutes and generate all the files for you.

## Testing the Solana contract

Test suite in [../solana/tests/suites/payment.spec.ts]:

```
cd ../solana
anchor test
```
