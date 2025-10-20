pub mod circuits;
pub mod hash;
pub mod indexed_tree;
pub mod manager;
pub mod merkle;
pub mod poseidon;

pub use circuits::{BatchInsertCircuit, IndexedBatchInsertCircuit, IndexedInsertCircuit};
pub use indexed_tree::{IndexedInsertStep, IndexedLeaf, SparseIndexedTree, build_indexed_tree};
pub use manager::signing::{
    ManagerKeypair, Signature, generate_manager_keypair, pack_receipt, public_key_to_fields, sign,
    signature_to_fields,
};
pub use manager::{
    ManagerPublicKey, ManagerSignature, TaskReceipt, task_receipt_message_native,
    task_receipt_nullifier_native,
};
pub use merkle::{build_merkle_tree, canonical_index_from_value, index_bits, merkle_path};

#[cfg(test)]
mod tests {
    use super::*;
    use ark_bn254::{Bn254, Fr};
    use ark_ff::{PrimeField, Zero};
    use ark_groth16::{Groth16, prepare_verifying_key};
    use ark_relations::r1cs::{ConstraintLayer, ConstraintSynthesizer, ConstraintSystem};
    use ark_std::rand::{SeedableRng, rngs::StdRng};
    use std::collections::{BTreeMap, HashMap};
    use std::convert::TryFrom;
    use tracing::subscriber::DefaultGuard;
    use tracing_subscriber::Registry;
    use tracing_subscriber::layer::SubscriberExt;

    fn enable_constraint_tracing() -> DefaultGuard {
        let constraint_layer = ConstraintLayer::default();
        let subscriber = Registry::default().with(constraint_layer);
        tracing::subscriber::set_default(subscriber)
    }

    #[test]
    fn batch_insert_updates_root() {
        let depth = 3usize;
        let default_leaf = Fr::zero();
        let mut leaves = vec![default_leaf; 1 << depth];

        let values = vec![Fr::from(11u64), Fr::from(22u64), Fr::from(33u64)];
        let indices = vec![0usize, 3usize, 5usize];

        let mut levels = build_merkle_tree(&leaves);
        let initial_root = levels.last().unwrap()[0];

        let mut paths = Vec::new();
        for (&index, &value) in indices.iter().zip(values.iter()) {
            let path = merkle_path(&levels, index);
            paths.push(path);
            leaves[index] = value;
            levels = build_merkle_tree(&leaves);
        }
        let final_root = levels.last().unwrap()[0];

        let circuit = BatchInsertCircuit {
            initial_root,
            final_root,
            values_to_insert: values,
            paths,
            indices,
            default_leaf,
        };

        let cs = ConstraintSystem::<Fr>::new_ref();
        circuit.generate_constraints(cs.clone()).unwrap();
        let satisfied = cs.is_satisfied().unwrap();
        assert!(
            satisfied,
            "Unsatisfied constraint: {:?}",
            cs.which_is_unsatisfied()
        );
    }

    #[test]
    fn indexed_insert_updates_pointers() {
        let _trace_guard = enable_constraint_tracing();
        let depth = 21usize;
        let mut tree = SparseIndexedTree::<Fr>::new(depth, IndexedLeaf::default());

        let low_index = 1usize;
        let existing_next_index = 4usize;
        let low_value = Fr::from(20u64);
        let low_next_value = Fr::from(50u64);
        let new_value = Fr::from(30u64);
        let new_index = canonical_index_from_value(&new_value, depth);

        let low_leaf_before = IndexedLeaf {
            value: low_value,
            next_index: Fr::from(existing_next_index as u64),
            next_value: low_next_value,
        };
        let existing_next_leaf = IndexedLeaf {
            value: low_next_value,
            next_index: Fr::from(0u64),
            next_value: Fr::from(0u64),
        };

        tree.set_leaf(low_index, low_leaf_before.clone());
        tree.set_leaf(existing_next_index, existing_next_leaf);

        let initial_root = tree.root();
        let low_leaf_path = tree.path(low_index);
        let new_leaf_path_before = tree.path(new_index);
        let new_leaf_before = IndexedLeaf::default();

        let mut tree_after_low = tree.clone();
        tree_after_low.set_leaf(
            low_index,
            IndexedLeaf {
                value: low_value,
                next_index: Fr::from(new_index as u64),
                next_value: new_value,
            },
        );
        let new_leaf_path_after = tree_after_low.path(new_index);

        let mut tree_final = tree_after_low.clone();
        tree_final.set_leaf(
            new_index,
            IndexedLeaf {
                value: new_value,
                next_index: Fr::from(existing_next_index as u64),
                next_value: low_next_value,
            },
        );
        let final_root = tree_final.root();

        let circuit = IndexedInsertCircuit {
            initial_root,
            final_root,
            low_leaf: low_leaf_before,
            low_leaf_path,
            low_leaf_index: low_index,
            new_leaf_index: new_index,
            new_leaf_old: new_leaf_before,
            new_leaf_path_before,
            new_leaf_path_after,
            new_value,
        };

        let cs = ConstraintSystem::<Fr>::new_ref();
        circuit.generate_constraints(cs.clone()).unwrap();
        let satisfied = cs.is_satisfied().unwrap();
        assert!(
            satisfied,
            "Unsatisfied constraint: {:?}",
            cs.which_is_unsatisfied()
        );
    }

    #[derive(Clone, Copy)]
    struct LeafMeta {
        value: Fr,
        next_index: usize,
        next_value: Fr,
    }

    impl LeafMeta {
        fn to_indexed(&self) -> IndexedLeaf<Fr> {
            IndexedLeaf {
                value: self.value,
                next_index: Fr::from(u64::try_from(self.next_index).expect("index fits in field")),
                next_value: self.next_value,
            }
        }
    }

    #[derive(Clone, Copy)]
    struct TaskReceiptInput {
        task_id: u64,
        reward: u64,
        duration: u64,
    }

    struct BatchScenario {
        depth: usize,
        initial_root: Fr,
        final_root: Fr,
        steps: Vec<IndexedInsertStep<Fr>>,
        total_reward: Fr,
        receipts: Vec<TaskReceipt<Fr>>,
        leaves: HashMap<usize, LeafMeta>,
        ordering: BTreeMap<<Fr as PrimeField>::BigInt, usize>,
        tree: SparseIndexedTree<Fr>,
        manager_pub_x: Fr,
        manager_pub_y: Fr,
    }

    fn perform_indexed_insert(
        tree: &mut SparseIndexedTree<Fr>,
        leaves: &mut HashMap<usize, LeafMeta>,
        ordering: &mut BTreeMap<<Fr as PrimeField>::BigInt, usize>,
        receipt_input: TaskReceiptInput,
        rng: &mut StdRng,
        manager_keys: &ManagerKeypair,
        default_meta: &LeafMeta,
    ) -> (Fr, IndexedInsertStep<Fr>) {
        let depth = tree.depth();
        let (receipt, new_index) = pack_receipt(
            rng,
            manager_keys,
            receipt_input.task_id,
            receipt_input.reward,
            receipt_input.duration,
            depth,
        );

        let nullifier_key = receipt.nullifier.into_bigint();
        assert!(
            !ordering.contains_key(&nullifier_key),
            "nullifier values must be unique"
        );

        assert!(
            !leaves.contains_key(&new_index),
            "new leaf index must be unused"
        );

        let initial_root = tree.root();
        let low_index = ordering
            .range(..nullifier_key.clone())
            .next_back()
            .map(|(_, idx)| *idx)
            .unwrap_or_else(|| {
                ordering
                    .iter()
                    .next_back()
                    .map(|(_, idx)| *idx)
                    .expect("tree must contain at least one leaf")
            });

        let low_meta = leaves
            .get(&low_index)
            .copied()
            .expect("low leaf must exist");
        let low_leaf_before = low_meta.to_indexed();

        let low_leaf_path = tree.path(low_index);
        let new_leaf_path_before = tree.path(new_index);
        let new_leaf_old_meta = leaves.get(&new_index).copied().unwrap_or(*default_meta);
        assert!(new_leaf_old_meta.value.is_zero());
        let new_leaf_old = new_leaf_old_meta.to_indexed();

        let next_index_before = low_meta.next_index;
        let next_value_before = low_meta.next_value;

        let mut updated_low_meta = low_meta;
        updated_low_meta.next_index = new_index;
        updated_low_meta.next_value = receipt.nullifier;

        let mut tree_after_low = tree.clone();
        tree_after_low.set_leaf(low_index, updated_low_meta.to_indexed());
        let new_leaf_path_after = tree_after_low.path(new_index);

        let new_leaf_meta = LeafMeta {
            value: receipt.nullifier,
            next_index: next_index_before,
            next_value: next_value_before,
        };

        let mut tree_final = tree_after_low.clone();
        tree_final.set_leaf(new_index, new_leaf_meta.to_indexed());
        let final_root = tree_final.root();

        let circuit = IndexedInsertCircuit {
            initial_root,
            final_root,
            low_leaf: low_leaf_before.clone(),
            low_leaf_path: low_leaf_path.clone(),
            low_leaf_index: low_index,
            new_leaf_index: new_index,
            new_leaf_old: new_leaf_old.clone(),
            new_leaf_path_before: new_leaf_path_before.clone(),
            new_leaf_path_after: new_leaf_path_after.clone(),
            new_value: receipt.nullifier,
        };

        let cs = ConstraintSystem::<Fr>::new_ref();
        circuit.generate_constraints(cs.clone()).unwrap();
        assert!(cs.is_satisfied().unwrap());

        let step = IndexedInsertStep {
            receipt,
            low_leaf: low_leaf_before,
            low_leaf_path: low_leaf_path.clone(),
            low_leaf_index: low_index,
            new_leaf_index: new_index,
            new_leaf_old: new_leaf_old,
            new_leaf_path_before: new_leaf_path_before.clone(),
            new_leaf_path_after: new_leaf_path_after.clone(),
        };

        *tree = tree_final;
        leaves.insert(low_index, updated_low_meta);
        leaves.insert(new_index, new_leaf_meta);
        ordering.insert(nullifier_key, new_index);

        (final_root, step)
    }

    fn build_batch_scenario(count: usize) -> BatchScenario {
        assert!(count > 0, "batch size must be positive");
        let depth = 21usize;
        let default_meta = LeafMeta {
            value: Fr::from(0u64),
            next_index: 0,
            next_value: Fr::from(0u64),
        };
        let mut tree = SparseIndexedTree::<Fr>::new(depth, default_meta.to_indexed());
        let mut leaves: HashMap<usize, LeafMeta> = HashMap::new();
        let mut ordering: BTreeMap<<Fr as PrimeField>::BigInt, usize> = BTreeMap::new();

        let mut seed_leaf = |index: usize, meta: LeafMeta| {
            if !meta.value.is_zero() {
                ordering.insert(meta.value.into_bigint(), index);
            }
            leaves.insert(index, meta.clone());
            tree.set_leaf(index, meta.to_indexed());
        };

        seed_leaf(
            1,
            LeafMeta {
                value: Fr::from(20u64),
                next_index: 4,
                next_value: Fr::from(80u64),
            },
        );
        seed_leaf(
            4,
            LeafMeta {
                value: Fr::from(80u64),
                next_index: 0,
                next_value: Fr::from(0u64),
            },
        );

        let mut receipt_inputs = Vec::with_capacity(count);
        for i in 0..count {
            receipt_inputs.push(TaskReceiptInput {
                task_id: 1 + i as u64,
                reward: 5 + i as u64 * 5,
                duration: 100 + i as u64 * 3,
            });
        }

        let mut rng = StdRng::seed_from_u64(42);
        let manager_keys = generate_manager_keypair(&mut rng);
        let manager_public_fields = public_key_to_fields(&manager_keys.public);

        let initial_root = tree.root();
        let mut latest_root = initial_root;
        let mut steps = Vec::with_capacity(count);
        let mut total_reward_acc = 0u64;
        let mut receipts = Vec::with_capacity(count);

        for receipt_input in receipt_inputs {
            total_reward_acc += receipt_input.reward;
            let (new_root, step) = perform_indexed_insert(
                &mut tree,
                &mut leaves,
                &mut ordering,
                receipt_input,
                &mut rng,
                &manager_keys,
                &default_meta,
            );
            latest_root = new_root;
            receipts.push(step.receipt.clone());
            steps.push(step);
        }

        BatchScenario {
            depth,
            initial_root,
            final_root: latest_root,
            steps,
            total_reward: Fr::from(total_reward_acc),
            receipts,
            leaves,
            ordering,
            tree,
            manager_pub_x: manager_public_fields.x,
            manager_pub_y: manager_public_fields.y,
        }
    }

    #[test]
    fn indexed_insert_end_to_end_flow() {
        let scenario = build_batch_scenario(5);
        assert_eq!(scenario.tree.root(), scenario.final_root);

        let batch_circuit = IndexedBatchInsertCircuit {
            initial_root: scenario.initial_root,
            final_root: scenario.final_root,
            steps: scenario.steps.clone(),
            total_reward: scenario.total_reward,
            manager_pub_x: scenario.manager_pub_x,
            manager_pub_y: scenario.manager_pub_y,
        };

        let cs = ConstraintSystem::<Fr>::new_ref();
        batch_circuit.generate_constraints(cs.clone()).unwrap();
        assert!(cs.is_satisfied().unwrap());

        for receipt in &scenario.receipts {
            let key = receipt.nullifier.into_bigint();
            assert!(scenario.ordering.contains_key(&key));
        }

        for (index, meta) in scenario.leaves.iter() {
            if meta.value.is_zero() {
                continue;
            }
            if !meta.next_value.is_zero() {
                assert!(
                    meta.next_value.into_bigint() > meta.value.into_bigint(),
                    "pointer ordering must remain strict"
                );
                let successor = scenario
                    .leaves
                    .get(&meta.next_index)
                    .expect("successor leaf must exist");
                assert_eq!(
                    successor.value, meta.next_value,
                    "next_value must mirror successor's value"
                );
            } else {
                assert_eq!(
                    meta.next_index, 0,
                    "zero next_value should only point to index 0"
                );
            }

            let path = scenario.tree.path(*index);
            assert_eq!(path.len(), scenario.depth, "path length should match depth");
        }
    }

    #[test]
    fn groth16_batch_proof_validates() {
        let scenario = build_batch_scenario(20);
        let mut rng = StdRng::seed_from_u64(1337);

        let circuit = IndexedBatchInsertCircuit {
            initial_root: scenario.initial_root,
            final_root: scenario.final_root,
            steps: scenario.steps.clone(),
            total_reward: scenario.total_reward,
            manager_pub_x: scenario.manager_pub_x,
            manager_pub_y: scenario.manager_pub_y,
        };

        let params =
            Groth16::<Bn254>::generate_random_parameters_with_reduction(circuit.clone(), &mut rng)
                .unwrap();
        let proof =
            Groth16::<Bn254>::create_random_proof_with_reduction(circuit, &params, &mut rng)
                .unwrap();
        let pvk = prepare_verifying_key(&params.vk);

        let public_inputs = vec![
            scenario.initial_root,
            scenario.final_root,
            scenario.total_reward,
            scenario.manager_pub_x,
            scenario.manager_pub_y,
        ];
        assert!(Groth16::<Bn254>::verify_proof(&pvk, &proof, &public_inputs).unwrap());

        let mut bad_inputs = public_inputs.clone();
        bad_inputs[2] += Fr::from(1u64);
        assert!(!Groth16::<Bn254>::verify_proof(&pvk, &proof, &bad_inputs).unwrap());

        let mut bad_manager_inputs = public_inputs.clone();
        bad_manager_inputs[3] += Fr::from(1u64);
        assert!(!Groth16::<Bn254>::verify_proof(&pvk, &proof, &bad_manager_inputs).unwrap());
    }
}
