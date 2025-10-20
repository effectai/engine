use ark_ff::{BigInteger, PrimeField};

use crate::hash::hash_two_native;

pub fn build_merkle_tree<F: PrimeField>(leaves: &[F]) -> Vec<Vec<F>> {
    assert!(!leaves.is_empty(), "tree must contain at least one leaf");
    assert!(
        leaves.len().is_power_of_two(),
        "leaf count must be a power of two"
    );

    let mut levels = Vec::new();
    levels.push(leaves.to_vec());

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

pub fn merkle_path<F: PrimeField>(levels: &[Vec<F>], mut index: usize) -> Vec<F> {
    assert!(index < levels[0].len(), "index out of bounds");
    let depth = levels.len() - 1;
    let mut path = Vec::with_capacity(depth);

    for level in 0..depth {
        let sibling = if index % 2 == 0 {
            levels[level][index + 1]
        } else {
            levels[level][index - 1]
        };
        path.push(sibling);
        index /= 2;
    }

    path
}

pub fn index_bits(mut index: usize, depth: usize) -> Vec<bool> {
    let mut bits = Vec::with_capacity(depth);
    for _ in 0..depth {
        bits.push(index & 1 == 1);
        index >>= 1;
    }
    bits
}

pub fn canonical_index_from_value<F: PrimeField>(value: &F, depth: usize) -> usize {
    let bigint = value.into_bigint();
    let mut index = 0usize;
    for i in 0..depth {
        if bigint.get_bit(i as usize) {
            index |= 1 << i;
        }
    }
    index
}
