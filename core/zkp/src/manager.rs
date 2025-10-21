use ark_crypto_primitives::sponge::Absorb;
use ark_crypto_primitives::sponge::CryptographicSponge;
use ark_crypto_primitives::sponge::poseidon::constraints::PoseidonSpongeVar;
use ark_crypto_primitives::sponge::poseidon::{PoseidonConfig, PoseidonSponge};
use ark_ff::PrimeField;
use ark_r1cs_std::{R1CSVar, fields::fp::FpVar};
use ark_relations::r1cs::SynthesisError;

#[derive(Clone, Debug)]
pub struct ManagerSignature<F: PrimeField> {
    pub r_x: F,
    pub r_y: F,
    pub s: F,
}

#[derive(Clone, Debug)]
pub struct ManagerPublicKey<F: PrimeField> {
    pub x: F,
    pub y: F,
}

#[derive(Clone, Debug)]
pub struct TaskReceipt<F: PrimeField> {
    pub task_id: F,
    pub reward: F,
    pub duration: F,
    pub signature: ManagerSignature<F>,
    pub manager_public: ManagerPublicKey<F>,
    pub nullifier: F,
}

pub fn task_receipt_message_native<F: PrimeField + Absorb>(
    params: &PoseidonConfig<F>,
    task_id: &F,
    reward: &F,
    duration: &F,
) -> F {
    let mut sponge = PoseidonSponge::<F>::new(params);
    sponge.absorb(task_id);
    sponge.absorb(reward);
    sponge.absorb(duration);
    sponge.squeeze_field_elements(1)[0]
}

pub fn task_receipt_nullifier_native<F: PrimeField + Absorb>(
    params: &PoseidonConfig<F>,
    task_id: &F,
    reward: &F,
    duration: &F,
    signature: &ManagerSignature<F>,
) -> F {
    let mut sponge = PoseidonSponge::<F>::new(params);
    sponge.absorb(task_id);
    sponge.absorb(reward);
    sponge.absorb(duration);
    sponge.absorb(&signature.r_x);
    sponge.absorb(&signature.r_y);
    sponge.absorb(&signature.s);
    sponge.squeeze_field_elements(1)[0]
}

pub(crate) fn task_receipt_nullifier_gadget<F: PrimeField>(
    params: &PoseidonConfig<F>,
    task_id: &FpVar<F>,
    reward: &FpVar<F>,
    duration: &FpVar<F>,
    signature_r_x: &FpVar<F>,
    signature_r_y: &FpVar<F>,
    signature_s: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    use ark_crypto_primitives::sponge::constraints::CryptographicSpongeVar;

    let cs = task_id
        .cs()
        .or(reward.cs())
        .or(duration.cs())
        .or(signature_r_x.cs())
        .or(signature_r_y.cs())
        .or(signature_s.cs());
    let mut sponge = PoseidonSpongeVar::new(cs, params);
    sponge.absorb(task_id)?;
    sponge.absorb(reward)?;
    sponge.absorb(duration)?;
    sponge.absorb(signature_r_x)?;
    sponge.absorb(signature_r_y)?;
    sponge.absorb(signature_s)?;
    let result = sponge.squeeze_field_elements(1)?;
    Ok(result[0].clone())
}

pub mod signing {
    use super::{
        ManagerPublicKey, ManagerSignature, PoseidonSponge, TaskReceipt,
        task_receipt_message_native, task_receipt_nullifier_native,
    };
    use crate::merkle::canonical_index_from_value;
    use crate::poseidon::poseidon_parameters;
    use ark_bn254::{Fq, Fr as ManagerScalar, G1Affine, G1Projective};
    use ark_crypto_primitives::sponge::CryptographicSponge;
    use ark_ec::{CurveGroup, Group};
    use ark_ff::{PrimeField, UniformRand};
    use ark_std::rand::Rng;

    #[derive(Clone, Debug)]
    pub struct ManagerKeypair {
        pub secret: ManagerScalar,
        pub public: G1Affine,
    }

    #[derive(Clone, Debug)]
    pub struct Signature {
        pub r: G1Affine,
        pub s: ManagerScalar,
    }

    pub fn generate_manager_keypair<R: Rng>(rng: &mut R) -> ManagerKeypair {
        let secret = ManagerScalar::rand(rng);
        let public = (G1Projective::generator() * secret).into_affine();
        ManagerKeypair { secret, public }
    }

    fn fq_to_scalar(value: Fq) -> ManagerScalar {
        ManagerScalar::from_bigint(value.into_bigint()).expect("compatible field sizes")
    }

    fn poseidon_challenge(inputs: &[ManagerScalar]) -> ManagerScalar {
        let params = poseidon_parameters::<ManagerScalar>(inputs.len().max(2));
        let mut sponge = PoseidonSponge::<ManagerScalar>::new(&params);
        for input in inputs {
            sponge.absorb(input);
        }
        sponge.squeeze_field_elements(1)[0]
    }

    pub fn sign<R: Rng>(
        rng: &mut R,
        keypair: &ManagerKeypair,
        message: ManagerScalar,
    ) -> Signature {
        let k = ManagerScalar::rand(rng);
        let r_proj = G1Projective::generator() * k;
        let r_affine = r_proj.into_affine();

        let challenge_field = poseidon_challenge(&[
            fq_to_scalar(r_affine.x),
            fq_to_scalar(r_affine.y),
            fq_to_scalar(keypair.public.x),
            fq_to_scalar(keypair.public.y),
            message,
        ]);
        let s = k + challenge_field * keypair.secret;
        Signature { r: r_affine, s }
    }

    pub fn signature_to_fields(signature: &Signature) -> ManagerSignature<ManagerScalar> {
        ManagerSignature {
            r_x: fq_to_scalar(signature.r.x),
            r_y: fq_to_scalar(signature.r.y),
            s: signature.s,
        }
    }

    pub fn public_key_to_fields(public: &G1Affine) -> ManagerPublicKey<ManagerScalar> {
        ManagerPublicKey {
            x: fq_to_scalar(public.x),
            y: fq_to_scalar(public.y),
        }
    }

    /// Build a `TaskReceipt` along with its canonical sparse-tree index for the given depth.
    pub fn pack_receipt<R: Rng>(
        rng: &mut R,
        keypair: &ManagerKeypair,
        task_id: u64,
        reward: u64,
        duration: u64,
        depth: usize,
    ) -> (TaskReceipt<ManagerScalar>, usize) {
        let task_id_f = ManagerScalar::from(task_id);
        let reward_f = ManagerScalar::from(reward);
        let duration_f = ManagerScalar::from(duration);

        let message_params = poseidon_parameters::<ManagerScalar>(3);
        let message =
            task_receipt_message_native(&message_params, &task_id_f, &reward_f, &duration_f);

        let signature_native = sign(rng, keypair, message);
        let signature_fields = signature_to_fields(&signature_native);
        let manager_public_fields = public_key_to_fields(&keypair.public);

        let nullifier_params = poseidon_parameters::<ManagerScalar>(6);
        let nullifier = task_receipt_nullifier_native(
            &nullifier_params,
            &task_id_f,
            &reward_f,
            &duration_f,
            &signature_fields,
        );

        let index = canonical_index_from_value(&nullifier, depth);
        let receipt = TaskReceipt {
            task_id: task_id_f,
            reward: reward_f,
            duration: duration_f,
            signature: signature_fields,
            manager_public: manager_public_fields,
            nullifier,
        };
        (receipt, index)
    }
}
