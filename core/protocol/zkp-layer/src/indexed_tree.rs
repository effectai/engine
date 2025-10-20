use ark_ff::PrimeField;
use ark_r1cs_std::fields::fp::FpVar;
use ark_relations::r1cs::SynthesisError;
use std::collections::HashMap;

use crate::hash::{hash_three_gadget, hash_three_native, hash_two_native};
use crate::manager::TaskReceipt;

#[derive(Clone, Debug)]
pub struct IndexedLeaf<F: PrimeField> {
    pub value: F,
    pub next_index: F,
    pub next_value: F,
}

impl<F: PrimeField> Default for IndexedLeaf<F> {
    fn default() -> Self {
        Self {
            value: F::from(0u64),
            next_index: F::from(0u64),
            next_value: F::from(0u64),
        }
    }
}

#[derive(Clone)]
pub struct IndexedInsertStep<F: PrimeField> {
    pub receipt: TaskReceipt<F>,
    pub low_leaf: IndexedLeaf<F>,
    pub low_leaf_path: Vec<F>,
    pub low_leaf_index: usize,
    pub new_leaf_index: usize,
    pub new_leaf_old: IndexedLeaf<F>,
    pub new_leaf_path_before: Vec<F>,
    pub new_leaf_path_after: Vec<F>,
}

pub(crate) fn hash_leaf_native<F: PrimeField>(leaf: &IndexedLeaf<F>) -> F {
    hash_three_native(&leaf.value, &leaf.next_index, &leaf.next_value)
}

pub(crate) fn hash_leaf_gadget<F: PrimeField>(
    value: &FpVar<F>,
    next_index: &FpVar<F>,
    next_value: &FpVar<F>,
) -> Result<FpVar<F>, SynthesisError> {
    hash_three_gadget(value, next_index, next_value)
}

pub fn build_indexed_tree<F: PrimeField>(leaves: &[IndexedLeaf<F>]) -> Vec<Vec<F>> {
    assert!(!leaves.is_empty(), "tree must contain at least one leaf");
    assert!(
        leaves.len().is_power_of_two(),
        "leaf count must be a power of two"
    );

    let mut levels = Vec::new();
    let hashed_leaves: Vec<F> = leaves
        .iter()
        .map(|leaf| hash_leaf_native(leaf))
        .collect();
    levels.push(hashed_leaves);

    while levels.last().unwrap().len() > 1 {
        let prev = levels.last().unwrap();
        let mut next = Vec::with_capacity(prev.len() / 2);

        for chunk in prev.chunks(2) {
            let left = chunk[0];
            let right = chunk[1];
            next.push(hash_two_native(&left, &right));
        }

        levels.push(next);
    }

    levels
}

#[derive(Clone)]
pub struct SparseIndexedTree<F: PrimeField> {
    depth: usize,
    default_hashes: Vec<F>,
    nodes: Vec<HashMap<usize, F>>,
}

impl<F: PrimeField> SparseIndexedTree<F> {
    pub fn new(depth: usize, default_leaf: IndexedLeaf<F>) -> Self {
        assert!(depth > 0, "depth must be positive");

        let mut default_hashes = Vec::with_capacity(depth + 1);
        let default_leaf_hash = hash_leaf_native(&default_leaf);
        default_hashes.push(default_leaf_hash);
        for level in 1..=depth {
            let prev = default_hashes[level - 1];
            default_hashes.push(hash_two_native(&prev, &prev));
        }

        let mut nodes = Vec::with_capacity(depth + 1);
        for _ in 0..=depth {
            nodes.push(HashMap::new());
        }

        Self {
            depth,
            default_hashes,
            nodes,
        }
    }

    pub fn depth(&self) -> usize {
        self.depth
    }

    fn get_node_hash(&self, level: usize, index: usize) -> F {
        self.nodes[level]
            .get(&index)
            .copied()
            .unwrap_or(self.default_hashes[level])
    }

    pub fn set_leaf(&mut self, index: usize, leaf: IndexedLeaf<F>) {
        assert!(index < (1usize << self.depth), "index out of bounds");
        let mut current_index = index;
        let mut current_hash = hash_leaf_native(&leaf);
        self.nodes[0].insert(index, current_hash);

        for level in 1..=self.depth {
            let parent_index = current_index / 2;
            let left_child = parent_index * 2;
            let right_child = left_child + 1;

            let left_hash = if current_index == left_child {
                current_hash
            } else {
                self.get_node_hash(level - 1, left_child)
            };
            let right_hash = if current_index == right_child {
                current_hash
            } else {
                self.get_node_hash(level - 1, right_child)
            };

            let parent_hash = hash_two_native(&left_hash, &right_hash);
            self.nodes[level].insert(parent_index, parent_hash);
            current_index = parent_index;
            current_hash = parent_hash;
        }
    }

    pub fn path(&self, mut index: usize) -> Vec<F> {
        let mut path = Vec::with_capacity(self.depth);
        for level in 0..self.depth {
            let sibling_index = if index % 2 == 0 { index + 1 } else { index - 1 };
            let sibling_hash = self.get_node_hash(level, sibling_index);
            path.push(sibling_hash);
            index /= 2;
        }
        path
    }

    pub fn root(&self) -> F {
        self.get_node_hash(self.depth, 0)
    }
}
