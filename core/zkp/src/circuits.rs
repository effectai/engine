use crate::hash::hash_two_gadget;
use crate::indexed_tree::{IndexedInsertStep, IndexedLeaf, hash_leaf_gadget};
use crate::manager::task_receipt_nullifier_gadget;
use crate::merkle::index_bits;
use crate::poseidon::poseidon_parameters;
use ark_ff::PrimeField;
use ark_r1cs_std::{
    alloc::AllocVar,
    bits::ToBitsGadget,
    boolean::Boolean,
    eq::EqGadget,
    fields::{FieldVar, fp::FpVar},
};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystemRef, SynthesisError};

#[derive(Clone)]
pub struct BatchInsertCircuit<F: PrimeField> {
    pub initial_root: F,
    pub final_root: F,
    pub values_to_insert: Vec<F>,
    pub paths: Vec<Vec<F>>,
    pub indices: Vec<usize>,
    pub default_leaf: F,
}

impl<F: PrimeField> ConstraintSynthesizer<F> for BatchInsertCircuit<F> {
    fn generate_constraints(self, cs: ConstraintSystemRef<F>) -> Result<(), SynthesisError> {
        let insertions = self.values_to_insert.len();
        if insertions == 0 {
            let initial_root_var = FpVar::new_input(cs.clone(), || Ok(self.initial_root))?;
            let final_root_var = FpVar::new_input(cs, || Ok(self.final_root))?;
            initial_root_var.enforce_equal(&final_root_var)?;
            return Ok(());
        }

        if self.paths.len() != insertions || self.indices.len() != insertions {
            return Err(SynthesisError::AssignmentMissing);
        }

        let depth = self.paths[0].len();
        if depth == 0 {
            return Err(SynthesisError::AssignmentMissing);
        }

        for path in &self.paths {
            if path.len() != depth {
                return Err(SynthesisError::AssignmentMissing);
            }
        }

        let initial_root_var = FpVar::new_input(cs.clone(), || Ok(self.initial_root))?;
        let final_root_var = FpVar::new_input(cs.clone(), || Ok(self.final_root))?;
        let default_var = FpVar::constant(self.default_leaf);

        let mut current_root = initial_root_var;
        for ((value, path), index) in self
            .values_to_insert
            .iter()
            .zip(self.paths.iter())
            .zip(self.indices.iter())
        {
            let index_field = F::from(*index as u64);
            let index_var = FpVar::new_witness(cs.clone(), || Ok(index_field))?;

            let bit_vars = witness_index_bits(cs.clone(), *index, depth)?;
            enforce_index_encoding(&bit_vars, &index_var)?;

            let sibling_vars = witness_path(cs.clone(), path)?;
            let _ = enforce_merkle_path(&default_var, &bit_vars, &sibling_vars, &current_root)?;

            let value_var = FpVar::new_witness(cs.clone(), || Ok(*value))?;
            let updated_root = recompute_root(&value_var, &bit_vars, &sibling_vars)?;
            current_root = updated_root;
        }

        current_root.enforce_equal(&final_root_var)?;
        Ok(())
    }
}

#[derive(Clone)]
pub struct IndexedInsertCircuit<F: PrimeField> {
    pub initial_root: F,
    pub final_root: F,
    pub low_leaf: IndexedLeaf<F>,
    pub low_leaf_path: Vec<F>,
    pub low_leaf_index: usize,
    pub new_leaf_index: usize,
    pub new_leaf_old: IndexedLeaf<F>,
    pub new_leaf_path_before: Vec<F>,
    pub new_leaf_path_after: Vec<F>,
    pub new_value: F,
}

impl<F: PrimeField> ConstraintSynthesizer<F> for IndexedInsertCircuit<F> {
    fn generate_constraints(self, cs: ConstraintSystemRef<F>) -> Result<(), SynthesisError> {
        let depth = self.low_leaf_path.len();
        if depth == 0
            || self.new_leaf_path_before.len() != depth
            || self.new_leaf_path_after.len() != depth
        {
            return Err(SynthesisError::AssignmentMissing);
        }

        let initial_root_var = FpVar::new_input(cs.clone(), || Ok(self.initial_root))?;
        let final_root_var = FpVar::new_input(cs.clone(), || Ok(self.final_root))?;

        let low_sibling_vars = witness_path(cs.clone(), &self.low_leaf_path)?;
        let new_sibling_before_vars = witness_path(cs.clone(), &self.new_leaf_path_before)?;
        let new_sibling_after_vars = witness_path(cs.clone(), &self.new_leaf_path_after)?;

        let low_bits: Vec<Boolean<F>> = index_bits(self.low_leaf_index, depth)
            .into_iter()
            .map(Boolean::constant)
            .collect();
        let new_bits = witness_index_bits(cs.clone(), self.new_leaf_index, depth)?;
        let new_index_const = FpVar::constant(F::from(self.new_leaf_index as u64));
        enforce_index_encoding(&new_bits, &new_index_const)?;

        let low_value_var = FpVar::new_witness(cs.clone(), || Ok(self.low_leaf.value))?;
        let low_next_index_var = FpVar::new_witness(cs.clone(), || Ok(self.low_leaf.next_index))?;
        let low_next_value_var = FpVar::new_witness(cs.clone(), || Ok(self.low_leaf.next_value))?;
        let low_leaf_hash_old =
            hash_leaf_gadget(&low_value_var, &low_next_index_var, &low_next_value_var)?;
        let _ = enforce_merkle_path(
            &low_leaf_hash_old,
            &low_bits,
            &low_sibling_vars,
            &initial_root_var,
        )?;

        let new_value_var = FpVar::new_witness(cs.clone(), || Ok(self.new_value))?;
        let new_gt_low = less_than(&low_value_var, &new_value_var)?;
        {
            let _ns = ark_relations::ns!(cs.clone(), "enforce_new_gt_low");
            new_gt_low.enforce_equal(&Boolean::constant(true))?;
        }

        let next_value_is_zero = low_next_value_var.is_zero()?;
        let new_lt_next = less_than(&new_value_var, &low_next_value_var)?;
        let upper_ok = next_value_is_zero.or(&new_lt_next)?;
        {
            let _ns = ark_relations::ns!(cs.clone(), "enforce_new_below_upper_bound");
            upper_ok.enforce_equal(&Boolean::constant(true))?;
        }

        let new_value_bits = new_value_var.to_bits_le()?;
        {
            let _ns = ark_relations::ns!(cs.clone(), "check_new_index_matches_value_bits");
            for (assigned_bit, derived_bit) in
                new_bits.iter().zip(new_value_bits.into_iter().take(depth))
            {
                assigned_bit.enforce_equal(&derived_bit)?;
            }
        }

        let new_leaf_old_value_var =
            FpVar::new_witness(cs.clone(), || Ok(self.new_leaf_old.value))?;
        let new_leaf_old_next_index_var =
            FpVar::new_witness(cs.clone(), || Ok(self.new_leaf_old.next_index))?;
        let new_leaf_old_next_value_var =
            FpVar::new_witness(cs.clone(), || Ok(self.new_leaf_old.next_value))?;

        let zero_const = FpVar::constant(F::zero());
        {
            let _ns = ark_relations::ns!(cs.clone(), "check_new_leaf_was_empty");
            new_leaf_old_value_var.enforce_equal(&zero_const)?;
            new_leaf_old_next_index_var.enforce_equal(&zero_const)?;
            new_leaf_old_next_value_var.enforce_equal(&zero_const)?;
        }

        let new_leaf_old_hash = hash_leaf_gadget(
            &new_leaf_old_value_var,
            &new_leaf_old_next_index_var,
            &new_leaf_old_next_value_var,
        )?;
        let _ = enforce_merkle_path(
            &new_leaf_old_hash,
            &new_bits,
            &new_sibling_before_vars,
            &initial_root_var,
        )?;

        let updated_low_hash = hash_leaf_gadget(&low_value_var, &new_index_const, &new_value_var)?;
        let root_after_low = recompute_root(&updated_low_hash, &low_bits, &low_sibling_vars)?;

        let _ = enforce_merkle_path(
            &new_leaf_old_hash,
            &new_bits,
            &new_sibling_after_vars,
            &root_after_low,
        )?;

        let new_leaf_updated_hash =
            hash_leaf_gadget(&new_value_var, &low_next_index_var, &low_next_value_var)?;

        let final_root_computed =
            recompute_root(&new_leaf_updated_hash, &new_bits, &new_sibling_after_vars)?;
        {
            let _ns = ark_relations::ns!(cs, "check_final_root_matches_public_input");
            final_root_computed.enforce_equal(&final_root_var)?;
        }

        Ok(())
    }
}

#[derive(Clone)]
pub struct IndexedBatchInsertCircuit<F: PrimeField> {
    pub initial_root: F,
    pub final_root: F,
    pub steps: Vec<IndexedInsertStep<F>>,
    pub total_reward: F,
    pub manager_pub_x: F,
    pub manager_pub_y: F,
}

impl<F: PrimeField> ConstraintSynthesizer<F> for IndexedBatchInsertCircuit<F> {
    fn generate_constraints(self, cs: ConstraintSystemRef<F>) -> Result<(), SynthesisError> {
        let initial_root_var = FpVar::new_input(cs.clone(), || Ok(self.initial_root))?;
        let final_root_var = FpVar::new_input(cs.clone(), || Ok(self.final_root))?;
        let total_reward_var = FpVar::new_input(cs.clone(), || Ok(self.total_reward))?;
        let manager_pub_x_var = FpVar::new_input(cs.clone(), || Ok(self.manager_pub_x))?;
        let manager_pub_y_var = FpVar::new_input(cs.clone(), || Ok(self.manager_pub_y))?;

        if self.steps.is_empty() {
            initial_root_var.enforce_equal(&final_root_var)?;
            let zero = FpVar::constant(F::zero());
            total_reward_var.enforce_equal(&zero)?;
            return Ok(());
        }

        let depth = self.steps[0].low_leaf_path.len();

        let receipt_params = poseidon_parameters::<F>(6);

        let mut current_root = initial_root_var;
        let mut accumulated_reward = FpVar::constant(F::zero());

        for step in self.steps.iter() {
            if step.low_leaf_path.len() != depth
                || step.new_leaf_path_before.len() != depth
                || step.new_leaf_path_after.len() != depth
            {
                return Err(SynthesisError::AssignmentMissing);
            }

            let low_sibling_vars = witness_path(cs.clone(), &step.low_leaf_path)?;
            let new_sibling_before_vars = witness_path(cs.clone(), &step.new_leaf_path_before)?;
            let new_sibling_after_vars = witness_path(cs.clone(), &step.new_leaf_path_after)?;

            let low_bits: Vec<Boolean<F>> = index_bits(step.low_leaf_index, depth)
                .into_iter()
                .map(Boolean::constant)
                .collect();
            let new_bits = witness_index_bits(cs.clone(), step.new_leaf_index, depth)?;
            let new_index_const = FpVar::constant(F::from(step.new_leaf_index as u64));
            enforce_index_encoding(&new_bits, &new_index_const)?;

            let low_value_var = FpVar::new_witness(cs.clone(), || Ok(step.low_leaf.value))?;
            let low_next_index_var =
                FpVar::new_witness(cs.clone(), || Ok(step.low_leaf.next_index))?;
            let low_next_value_var =
                FpVar::new_witness(cs.clone(), || Ok(step.low_leaf.next_value))?;

            let low_leaf_hash_old =
                hash_leaf_gadget(&low_value_var, &low_next_index_var, &low_next_value_var)?;
            let _ = enforce_merkle_path(
                &low_leaf_hash_old,
                &low_bits,
                &low_sibling_vars,
                &current_root,
            )?;

            let task_id_var = FpVar::new_witness(cs.clone(), || Ok(step.receipt.task_id))?;
            let reward_var = FpVar::new_witness(cs.clone(), || Ok(step.receipt.reward))?;
            let duration_var = FpVar::new_witness(cs.clone(), || Ok(step.receipt.duration))?;
            let signature_r_x_var =
                FpVar::new_witness(cs.clone(), || Ok(step.receipt.signature.r_x))?;
            let signature_r_y_var =
                FpVar::new_witness(cs.clone(), || Ok(step.receipt.signature.r_y))?;
            let signature_s_var = FpVar::new_witness(cs.clone(), || Ok(step.receipt.signature.s))?;
            let nullifier_var = FpVar::new_witness(cs.clone(), || Ok(step.receipt.nullifier))?;
            let manager_pub_x_step_var =
                FpVar::new_witness(cs.clone(), || Ok(step.receipt.manager_public.x))?;
            let manager_pub_y_step_var =
                FpVar::new_witness(cs.clone(), || Ok(step.receipt.manager_public.y))?;

            manager_pub_x_step_var.enforce_equal(&manager_pub_x_var)?;
            manager_pub_y_step_var.enforce_equal(&manager_pub_y_var)?;

            let computed_nullifier = task_receipt_nullifier_gadget(
                &receipt_params,
                &task_id_var,
                &reward_var,
                &duration_var,
                &signature_r_x_var,
                &signature_r_y_var,
                &signature_s_var,
            )?;
            nullifier_var.enforce_equal(&computed_nullifier)?;

            let new_value_var = nullifier_var.clone();
            let new_gt_low = less_than(&low_value_var, &new_value_var)?;
            new_gt_low.enforce_equal(&Boolean::constant(true))?;

            let next_value_is_zero = low_next_value_var.is_zero()?;
            let new_lt_next = less_than(&new_value_var, &low_next_value_var)?;
            let upper_ok = next_value_is_zero.or(&new_lt_next)?;
            upper_ok.enforce_equal(&Boolean::constant(true))?;

            let new_value_bits = new_value_var.to_bits_le()?;
            for (assigned_bit, derived_bit) in
                new_bits.iter().zip(new_value_bits.into_iter().take(depth))
            {
                assigned_bit.enforce_equal(&derived_bit)?;
            }

            let new_leaf_old_value_var =
                FpVar::new_witness(cs.clone(), || Ok(step.new_leaf_old.value))?;
            let new_leaf_old_next_index_var =
                FpVar::new_witness(cs.clone(), || Ok(step.new_leaf_old.next_index))?;
            let new_leaf_old_next_value_var =
                FpVar::new_witness(cs.clone(), || Ok(step.new_leaf_old.next_value))?;

            let zero_const = FpVar::constant(F::zero());
            new_leaf_old_value_var.enforce_equal(&zero_const)?;
            new_leaf_old_next_index_var.enforce_equal(&zero_const)?;
            new_leaf_old_next_value_var.enforce_equal(&zero_const)?;

            let new_leaf_old_hash = hash_leaf_gadget(
                &new_leaf_old_value_var,
                &new_leaf_old_next_index_var,
                &new_leaf_old_next_value_var,
            )?;
            let _ = enforce_merkle_path(
                &new_leaf_old_hash,
                &new_bits,
                &new_sibling_before_vars,
                &current_root,
            )?;

            let updated_low_hash =
                hash_leaf_gadget(&low_value_var, &new_index_const, &new_value_var)?;
            let root_after_low = recompute_root(&updated_low_hash, &low_bits, &low_sibling_vars)?;

            let _ = enforce_merkle_path(
                &new_leaf_old_hash,
                &new_bits,
                &new_sibling_after_vars,
                &root_after_low,
            )?;

            let new_leaf_updated_hash =
                hash_leaf_gadget(&new_value_var, &low_next_index_var, &low_next_value_var)?;
            let final_root_step =
                recompute_root(&new_leaf_updated_hash, &new_bits, &new_sibling_after_vars)?;
            current_root = final_root_step;

            accumulated_reward += reward_var;
        }

        current_root.enforce_equal(&final_root_var)?;
        accumulated_reward.enforce_equal(&total_reward_var)?;
        Ok(())
    }
}

fn witness_path<F: PrimeField>(
    cs: ConstraintSystemRef<F>,
    path: &[F],
) -> Result<Vec<FpVar<F>>, SynthesisError> {
    path.iter()
        .map(|sibling| FpVar::new_witness(cs.clone(), || Ok(*sibling)))
        .collect::<Result<Vec<_>, _>>()
}

fn witness_index_bits<F: PrimeField>(
    cs: ConstraintSystemRef<F>,
    index: usize,
    depth: usize,
) -> Result<Vec<Boolean<F>>, SynthesisError> {
    index_bits(index, depth)
        .into_iter()
        .map(|bit| Boolean::new_witness(cs.clone(), || Ok(bit)))
        .collect::<Result<Vec<_>, _>>()
}

fn enforce_merkle_path<F: PrimeField>(
    leaf: &FpVar<F>,
    bits: &[Boolean<F>],
    siblings: &[FpVar<F>],
    expected_root: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    let computed = recompute_root(leaf, bits, siblings)?;
    computed.enforce_equal(expected_root)?;
    Ok(computed)
}

fn enforce_index_encoding<F: PrimeField>(
    bits: &[Boolean<F>],
    index_var: &FpVar<F>,
) -> Result<(), SynthesisError> {
    let mut sum = FpVar::<F>::zero();
    let mut coeff = F::from(1u64);
    for bit in bits {
        let bit_fp = FpVar::from(bit.clone());
        let term = bit_fp * FpVar::constant(coeff);
        sum += term;
        coeff += coeff;
    }
    sum.enforce_equal(index_var)?;
    Ok(())
}

fn less_than<F: PrimeField>(a: &FpVar<F>, b: &FpVar<F>) -> Result<Boolean<F>, SynthesisError> {
    let a_bits = a.to_bits_le()?;
    let b_bits = b.to_bits_le()?;
    let mut result = Boolean::constant(false);
    let mut equal = Boolean::constant(true);

    for (a_bit, b_bit) in a_bits.iter().zip(b_bits.iter()).rev() {
        let not_a = a_bit.not();
        let a_lt_b_here = not_a.and(b_bit)?;
        let contribute = equal.and(&a_lt_b_here)?;
        result = result.or(&contribute)?;

        let bits_equal = a_bit.xor(b_bit)?.not();
        equal = equal.and(&bits_equal)?;
    }

    Ok(result)
}

fn recompute_root<F: PrimeField>(
    leaf: &FpVar<F>,
    bits: &[Boolean<F>],
    siblings: &[FpVar<F>],
) -> Result<FpVar<F>, SynthesisError> {
    let mut current = leaf.clone();
    for (bit, sibling) in bits.iter().zip(siblings.iter()) {
        let left = bit.select(sibling, &current)?;
        let right = bit.select(&current, sibling)?;
        current = hash_two_gadget(&left, &right)?;
    }
    Ok(current)
}
