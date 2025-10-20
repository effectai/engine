use ark_ff::PrimeField;
use ark_r1cs_std::fields::{FieldVar, fp::FpVar};
use ark_relations::r1cs::SynthesisError;

const C1: u64 = 7;
const C2: u64 = 19;

pub(crate) fn hash_two_native<F: PrimeField>(left: &F, right: &F) -> F {
    let sum = *left + *right + F::from(C1);
    let powered = sum.pow(&[5u64]);
    powered + F::from(C2)
}

pub(crate) fn hash_two_gadget<F: PrimeField>(
    left: &FpVar<F>,
    right: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let sum = left + right + FpVar::constant(F::from(C1));
    let powered = sum.pow_by_constant(&[5u64])?;
    Ok(powered + FpVar::constant(F::from(C2)))
}

pub(crate) fn hash_three_native<F: PrimeField>(a: &F, b: &F, c: &F) -> F {
    let first = hash_two_native(a, b);
    hash_two_native(&first, c)
}

pub(crate) fn hash_three_gadget<F: PrimeField>(
    a: &FpVar<F>,
    b: &FpVar<F>,
    c: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let first = hash_two_gadget(a, b)?;
    hash_two_gadget(&first, c)
}
