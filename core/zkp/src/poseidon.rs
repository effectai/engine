use ark_crypto_primitives::sponge::poseidon::traits::find_poseidon_ark_and_mds;
use ark_crypto_primitives::sponge::poseidon::PoseidonConfig;
use ark_ff::PrimeField;

/// Poseidon parameters for rate `rate` (capacity 1) using the commonly deployed
/// security-level choice of 8 full rounds and 57 partial rounds with alpha = 5.
pub(crate) fn poseidon_parameters<F: PrimeField>(rate: usize) -> PoseidonConfig<F> {
    const CAPACITY: usize = 1;
    const FULL_ROUNDS: usize = 8;
    const PARTIAL_ROUNDS: usize = 57;
    const ALPHA: u64 = 5;

    let (ark, mds) = find_poseidon_ark_and_mds::<F>(
        F::MODULUS_BIT_SIZE as u64,
        rate,
        FULL_ROUNDS as u64,
        PARTIAL_ROUNDS as u64,
        0,
    );

    PoseidonConfig {
        full_rounds: FULL_ROUNDS,
        partial_rounds: PARTIAL_ROUNDS,
        alpha: ALPHA,
        ark,
        mds,
        rate,
        capacity: CAPACITY,
    }
}
