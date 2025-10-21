use std::{
    collections::{BTreeMap, HashMap},
    fs::File,
    io::{BufWriter, Write},
    path::PathBuf,
};

use ark_bn254::{Bn254, Fr};
use ark_ff::{PrimeField, Zero};
use ark_groth16::{Groth16, ProvingKey, r1cs_to_qap::LibsnarkReduction};
use ark_serialize::CanonicalSerialize;
use ark_std::rand::{SeedableRng, rngs::StdRng};
use clap::{Parser, Subcommand};
use zkp::{
    IndexedBatchInsertCircuit, IndexedInsertStep, IndexedLeaf, ManagerKeypair, SparseIndexedTree,
    TaskReceipt, generate_manager_keypair, pack_receipt, public_key_to_fields,
};

#[derive(Parser)]
#[command(
    author,
    version,
    about = "Utility CLI for BN254 indexed insert prover setup"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate Groth16 proving and verifying keys for an indexed batch insert circuit.
    Setup {
        /// Maximum number of indexed inserts supported by the generated parameters.
        #[arg(long, default_value_t = 1000)]
        steps: usize,
        /// Depth of the sparse indexed tree.
        #[arg(long, default_value_t = 21)]
        depth: usize,
        /// Output path for the proving key (compressed).
        #[arg(long)]
        proving_key: PathBuf,
        /// Output path for the verifying key (compressed).
        #[arg(long)]
        verifying_key: PathBuf,
        /// RNG seed for reproducible parameter generation.
        #[arg(long, default_value_t = 1337)]
        seed: u64,
    },
}

fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Setup {
            steps,
            depth,
            proving_key,
            verifying_key,
            seed,
        } => setup_command(steps, depth, proving_key, verifying_key, seed),
    }
}

fn setup_command(
    steps: usize,
    depth: usize,
    pk_path: PathBuf,
    vk_path: PathBuf,
    seed: u64,
) -> anyhow::Result<()> {
    if steps == 0 {
        anyhow::bail!("steps must be greater than zero");
    }
    let (circuit, _) = build_batch_circuit(steps, depth)?;

    let mut rng = StdRng::seed_from_u64(seed);
    let pk: ProvingKey<Bn254> =
        Groth16::<Bn254, LibsnarkReduction>::generate_random_parameters_with_reduction(
            circuit.clone(),
            &mut rng,
        )?;
    let vk = pk.vk.clone();

    write_object(&pk_path, &pk)?;
    write_object(&vk_path, &vk)?;

    println!(
        "Generated Groth16 parameters for {} steps (depth {})\n  proving key: {}\n  verifying key: {}",
        steps,
        depth,
        pk_path.display(),
        vk_path.display()
    );
    Ok(())
}

fn write_object<T: CanonicalSerialize>(path: &PathBuf, value: &T) -> anyhow::Result<()> {
    let file = File::create(path)?;
    let mut writer = BufWriter::new(file);
    value.serialize_compressed(&mut writer)?;
    writer.flush()?;
    Ok(())
}

fn build_batch_circuit(
    count: usize,
    depth: usize,
) -> anyhow::Result<(IndexedBatchInsertCircuit<Fr>, Vec<TaskReceipt<Fr>>)> {
    let default_leaf = IndexedLeaf::default();
    let mut tree = SparseIndexedTree::<Fr>::new(depth, default_leaf);
    let mut leaves: HashMap<usize, LeafMeta> = HashMap::new();
    let mut ordering: BTreeMap<<Fr as PrimeField>::BigInt, usize> = BTreeMap::new();

    let mut seed_leaf = |index: usize, meta: LeafMeta| {
        if !meta.value.is_zero() {
            ordering.insert(meta.value.into_bigint(), index);
        }
        leaves.insert(index, meta.clone());
        tree.set_leaf(index, meta.to_indexed());
    };

    // Seed with a minimal valid list.
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
            next_value: Fr::zero(),
        },
    );

    let mut rng = StdRng::seed_from_u64(42);
    let manager_keys = generate_manager_keypair(&mut rng);
    let manager_public_fields = public_key_to_fields(&manager_keys.public);

    let default_meta = LeafMeta::default();
    let mut latest_root = tree.root();
    let mut steps_vec = Vec::with_capacity(count);
    let mut receipts = Vec::with_capacity(count);
    let mut total_reward_acc = Fr::zero();

    for i in 0..count {
        let task_id = 1 + i as u64;
        let reward = 10 + i as u64 * 3;
        let duration = 100 + i as u64 * 5;

        let (new_root, step, receipt) = perform_indexed_insert(
            &mut tree,
            &mut leaves,
            &mut ordering,
            TaskReceiptInput {
                task_id,
                reward,
                duration,
            },
            &mut rng,
            &manager_keys,
            &default_meta,
            depth,
        );
        latest_root = new_root;
        total_reward_acc += receipt.reward;
        receipts.push(receipt);
        steps_vec.push(step);
    }

    let circuit = IndexedBatchInsertCircuit {
        initial_root: tree.root(),
        final_root: latest_root,
        steps: steps_vec,
        total_reward: total_reward_acc,
        manager_pub_x: manager_public_fields.x,
        manager_pub_y: manager_public_fields.y,
    };

    Ok((circuit, receipts))
}

#[derive(Clone, Copy, Default)]
struct LeafMeta {
    value: Fr,
    next_index: usize,
    next_value: Fr,
}

impl LeafMeta {
    fn to_indexed(&self) -> IndexedLeaf<Fr> {
        IndexedLeaf {
            value: self.value,
            next_index: Fr::from(self.next_index as u64),
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

#[allow(clippy::too_many_arguments)]
fn perform_indexed_insert(
    tree: &mut SparseIndexedTree<Fr>,
    leaves: &mut HashMap<usize, LeafMeta>,
    ordering: &mut BTreeMap<<Fr as PrimeField>::BigInt, usize>,
    receipt_input: TaskReceiptInput,
    rng: &mut StdRng,
    manager_keys: &ManagerKeypair,
    default_meta: &LeafMeta,
    depth: usize,
) -> (Fr, IndexedInsertStep<Fr>, TaskReceipt<Fr>) {
    let (receipt, new_index) = pack_receipt(
        rng,
        manager_keys,
        receipt_input.task_id,
        receipt_input.reward,
        receipt_input.duration,
        depth,
    );
    let new_leaf_index = new_index;

    let nullifier_key = receipt.nullifier.into_bigint();
    assert!(
        !ordering.contains_key(&nullifier_key),
        "nullifier values must be unique"
    );
    assert!(!leaves.contains_key(&new_index), "new index already used");

    let low_index = ordering
        .range(..nullifier_key.clone())
        .next_back()
        .map(|(_, idx)| *idx)
        .unwrap_or_else(|| {
            ordering
                .iter()
                .next_back()
                .map(|(_, idx)| *idx)
                .expect("must have at least one seeded leaf")
        });

    let low_meta = leaves.get(&low_index).copied().unwrap_or(*default_meta);
    let low_leaf_before = low_meta.to_indexed();
    let low_leaf_path = tree.path(low_index);

    let new_leaf_old = IndexedLeaf::<Fr>::default();
    let new_leaf_path_before = tree.path(new_index);

    let mut tree_after_low = tree.clone();
    tree_after_low.set_leaf(
        low_index,
        IndexedLeaf {
            value: low_meta.value,
            next_index: Fr::from(new_index as u64),
            next_value: receipt.nullifier,
        },
    );
    let new_leaf_path_after = tree_after_low.path(new_index);

    let mut final_tree = tree_after_low.clone();
    final_tree.set_leaf(
        new_index,
        IndexedLeaf {
            value: receipt.nullifier,
            next_index: Fr::from(low_meta.next_index as u64),
            next_value: low_meta.next_value,
        },
    );
    let final_root = final_tree.root();

    tree.set_leaf(
        low_index,
        IndexedLeaf {
            value: low_meta.value,
            next_index: Fr::from(new_index as u64),
            next_value: receipt.nullifier,
        },
    );
    tree.set_leaf(
        new_index,
        IndexedLeaf {
            value: receipt.nullifier,
            next_index: Fr::from(low_meta.next_index as u64),
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
        receipt: receipt.clone(),
        low_leaf: low_leaf_before,
        low_leaf_path,
        low_leaf_index: low_index,
        new_leaf_index,
        new_leaf_old,
        new_leaf_path_before,
        new_leaf_path_after,
    };

    (final_root, step, receipt)
}
