use ark_crypto_primitives::sponge::poseidon::constraints::PoseidonSpongeVar;
use ark_crypto_primitives::sponge::poseidon::{PoseidonConfig, PoseidonSponge};
use ark_crypto_primitives::sponge::{Absorb, CryptographicSponge, constraints::CryptographicSpongeVar};
use ark_ff::PrimeField;
use ark_r1cs_std::{R1CSVar, fields::fp::FpVar};
use ark_relations::r1cs::{ConstraintSystemRef, SynthesisError};
use once_cell::sync::Lazy;
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use crate::poseidon::poseidon_parameters;

type CacheKey = (TypeId, usize);

static PARAM_CACHE: Lazy<Mutex<HashMap<CacheKey, Box<dyn Any + Send + Sync>>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

fn params_for<F: PrimeField + 'static>(rate: usize) -> Arc<PoseidonConfig<F>> {
    let key = (TypeId::of::<F>(), rate);
    {
        let cache = PARAM_CACHE.lock().expect("poseidon param cache poisoned");
        if let Some(entry) = cache.get(&key) {
            return entry
                .downcast_ref::<Arc<PoseidonConfig<F>>>()
                .expect("cached poseidon params have mismatched type")
                .clone();
        }
    }

    let params = Arc::new(poseidon_parameters::<F>(rate));
    let mut cache = PARAM_CACHE.lock().expect("poseidon param cache poisoned");
    let entry = cache.entry(key).or_insert_with(|| Box::new(params.clone()));
    entry
        .downcast_ref::<Arc<PoseidonConfig<F>>>()
        .expect("cached poseidon params have mismatched type")
        .clone()
}

fn poseidon_hash_native<F: PrimeField + Absorb + 'static>(inputs: &[F]) -> F {
    let params = params_for::<F>(inputs.len().max(2));
    let mut sponge = PoseidonSponge::<F>::new(params.as_ref());
    for input in inputs {
        sponge.absorb(input);
    }
    sponge.squeeze_field_elements(1)[0]
}

fn poseidon_hash_gadget<F: PrimeField + 'static>(
    cs: ConstraintSystemRef<F>,
    inputs: &[FpVar<F>],
) -> Result<FpVar<F>, SynthesisError> {
    let params = params_for::<F>(inputs.len().max(2));
    let mut sponge = PoseidonSpongeVar::new(cs, params.as_ref());
    for input in inputs {
        sponge.absorb(input)?;
    }
    let result = sponge.squeeze_field_elements(1)?;
    Ok(result[0].clone())
}

pub(crate) fn hash_two_native<F: PrimeField + Absorb + 'static>(left: &F, right: &F) -> F {
    poseidon_hash_native::<F>(&[*left, *right])
}

pub(crate) fn hash_two_gadget<F: PrimeField + 'static>(
    left: &FpVar<F>,
    right: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let cs = left.cs().or(right.cs());
    poseidon_hash_gadget(cs, &[left.clone(), right.clone()])
}

pub(crate) fn hash_three_native<F: PrimeField + Absorb + 'static>(a: &F, b: &F, c: &F) -> F {
    poseidon_hash_native::<F>(&[*a, *b, *c])
}

pub(crate) fn hash_three_gadget<F: PrimeField + 'static>(
    a: &FpVar<F>,
    b: &FpVar<F>,
    c: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let cs = a.cs().or(b.cs()).or(c.cs());
    poseidon_hash_gadget(cs, &[a.clone(), b.clone(), c.clone()])
}
