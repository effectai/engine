use ark_crypto_primitives::sponge::poseidon::constraints::PoseidonSpongeVar;
use ark_crypto_primitives::sponge::poseidon::PoseidonSponge;
use ark_crypto_primitives::sponge::{Absorb, CryptographicSponge, constraints::CryptographicSpongeVar};
use ark_ff::PrimeField;
use ark_r1cs_std::{R1CSVar, fields::fp::FpVar};
use ark_relations::r1cs::{ConstraintSystemRef, SynthesisError};

use crate::poseidon::poseidon_parameters;

fn poseidon_hash_native<F: PrimeField + Absorb>(inputs: &[F]) -> F {
    let params = poseidon_parameters::<F>(inputs.len().max(2));
    let mut sponge = PoseidonSponge::<F>::new(&params);
    for input in inputs {
        sponge.absorb(input);
    }
    sponge.squeeze_field_elements(1)[0]
}

fn poseidon_hash_gadget<F: PrimeField>(
    cs: ConstraintSystemRef<F>,
    inputs: &[FpVar<F>],
) -> Result<FpVar<F>, SynthesisError> {
    let params = poseidon_parameters::<F>(inputs.len().max(2));
    let mut sponge = PoseidonSpongeVar::new(cs, &params);
    for input in inputs {
        sponge.absorb(input)?;
    }
    let result = sponge.squeeze_field_elements(1)?;
    Ok(result[0].clone())
}

pub(crate) fn hash_two_native<F: PrimeField + Absorb>(left: &F, right: &F) -> F {
    poseidon_hash_native::<F>(&[*left, *right])
}

pub(crate) fn hash_two_gadget<F: PrimeField>(
    left: &FpVar<F>,
    right: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let cs = left.cs().or(right.cs());
    poseidon_hash_gadget(cs, &[left.clone(), right.clone()])
}

pub(crate) fn hash_three_native<F: PrimeField + Absorb>(a: &F, b: &F, c: &F) -> F {
    poseidon_hash_native::<F>(&[*a, *b, *c])
}

pub(crate) fn hash_three_gadget<F: PrimeField>(
    a: &FpVar<F>,
    b: &FpVar<F>,
    c: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let cs = a.cs().or(b.cs()).or(c.cs());
    poseidon_hash_gadget(cs, &[a.clone(), b.clone(), c.clone()])
}
