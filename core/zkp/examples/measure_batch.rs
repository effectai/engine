use ark_bn254::{Bn254, Fr};
use ark_ff::{PrimeField, Zero};
use ark_groth16::{Groth16, ProvingKey};
use ark_relations::r1cs::{ConstraintSynthesizer, ConstraintSystem};
use ark_serialize::CanonicalSerialize;
use ark_std::rand::{SeedableRng, rngs::StdRng};
use std::collections::{BTreeMap, HashMap};
use std::convert::TryFrom;
use std::env;
use std::time::Instant;
use zkp::{
    IndexedBatchInsertCircuit, IndexedInsertStep, IndexedLeaf, ManagerKeypair, SparseIndexedTree,
    generate_manager_keypair, pack_receipt, public_key_to_fields,
};

fn parse_batch_size() -> usize {
    env::args()
        .nth(1)
        .and_then(|arg| arg.parse::<usize>().ok())
        .unwrap_or(200)
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
    initial_root: Fr,
    final_root: Fr,
    steps: Vec<IndexedInsertStep<Fr>>,
    total_reward: Fr,
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
    _default_meta: &LeafMeta,
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

    let new_leaf_old = IndexedLeaf::<Fr>::default();
    let new_leaf_path_before = tree.path(new_index);

    let mut tree_after_low = tree.clone();
    tree_after_low.set_leaf(
        low_index,
        IndexedLeaf {
            value: low_meta.value,
            next_index: Fr::from(u64::try_from(new_index).expect("index fits")),
            next_value: receipt.nullifier,
        },
    );
    let new_leaf_path_after = tree_after_low.path(new_index);

    let mut final_tree = tree_after_low.clone();
    final_tree.set_leaf(
        new_index,
        IndexedLeaf {
            value: receipt.nullifier,
            next_index: Fr::from(u64::try_from(low_meta.next_index).expect("fits")),
            next_value: low_meta.next_value,
        },
    );
    let final_root = final_tree.root();

    tree.set_leaf(
        low_index,
        IndexedLeaf {
            value: low_meta.value,
            next_index: Fr::from(u64::try_from(new_index).expect("index fits")),
            next_value: receipt.nullifier,
        },
    );
    tree.set_leaf(
        new_index,
        IndexedLeaf {
            value: receipt.nullifier,
            next_index: Fr::from(u64::try_from(low_meta.next_index).expect("fits")),
            next_value: low_meta.next_value,
        },
    );

    let updated_low_meta = LeafMeta {
        value: low_meta.value,
        next_index: new_index,
        next_value: receipt.nullifier,
    };
    let new_leaf_meta = LeafMeta {
        value: receipt.nullifier,
        next_index: low_meta.next_index,
        next_value: low_meta.next_value,
    };
    leaves.insert(low_index, updated_low_meta);
    leaves.insert(new_index, new_leaf_meta);
    ordering.insert(nullifier_key, new_index);

    let step = IndexedInsertStep {
        receipt,
        low_leaf: low_leaf_before,
        low_leaf_path,
        low_leaf_index: low_index,
        new_leaf_index: new_index,
        new_leaf_old,
        new_leaf_path_before,
        new_leaf_path_after,
    };

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
        steps.push(step);
    }

    BatchScenario {
        initial_root,
        final_root: latest_root,
        steps,
        total_reward: Fr::from(total_reward_acc),
        manager_pub_x: manager_public_fields.x,
        manager_pub_y: manager_public_fields.y,
    }
}

fn measure(count: usize) {
    println!("Preparing scenario with {} inserts…", count);
    let scenario = build_batch_scenario(count);

    let circuit = IndexedBatchInsertCircuit {
        initial_root: scenario.initial_root,
        final_root: scenario.final_root,
        steps: scenario.steps.clone(),
        total_reward: scenario.total_reward,
        manager_pub_x: scenario.manager_pub_x,
        manager_pub_y: scenario.manager_pub_y,
    };

    let cs = ConstraintSystem::<Fr>::new_ref();
    let synth_start = Instant::now();
    circuit.clone().generate_constraints(cs.clone()).unwrap();
    let synth_elapsed = synth_start.elapsed();

    println!(
        "constraint_synthesis: {:?} | constraints={} | witness_vars={} | instance_vars={}",
        synth_elapsed,
        cs.num_constraints(),
        cs.num_witness_variables(),
        cs.num_instance_variables()
    );

    let mut rng = StdRng::seed_from_u64(12345);
    let keygen_start = Instant::now();
    let pk: ProvingKey<Bn254> =
        Groth16::<Bn254>::generate_random_parameters_with_reduction(circuit.clone(), &mut rng)
            .unwrap();
    let keygen_elapsed = keygen_start.elapsed();
    println!("key_generation: {:?}", keygen_elapsed);

    let prove_start = Instant::now();
    let proof = Groth16::<Bn254>::create_random_proof_with_reduction(circuit, &pk, &mut rng)
        .expect("proof");
    let prove_elapsed = prove_start.elapsed();

    let mut proof_bytes = Vec::new();
    proof
        .serialize_compressed(&mut proof_bytes)
        .expect("serialize proof");

    println!(
        "prove (CPU Groth16): {:?} | proof_size={} bytes",
        prove_elapsed,
        proof_bytes.len()
    );
}

fn main() {
    let count = parse_batch_size();
    measure(count);
}
