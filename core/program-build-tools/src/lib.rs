use std::{
    env, fs,
    path::{Path, PathBuf},
};

fn resolve_path(rel_or_abs: &str) -> PathBuf {
    let p = Path::new(rel_or_abs);
    if p.is_absolute() {
        p.to_path_buf()
    } else {
        PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap()).join(p)
    }
}

pub fn inject_program_id_env_from_keypair(var: &str, rel_or_abs_path: &str) {
    let path = env::var("PROGRAM_KEYPAIR_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| resolve_path(rel_or_abs_path));

    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed={}", path.display());
    println!("cargo:rerun-if-env-changed=PROGRAM_KEYPAIR_PATH");

    let data = fs::read(&path).unwrap_or_else(|e| {
        panic!(
            "Failed reading keypair at {}: {e}\n\
             Hint: run `anchor build` once to generate it, \
             or set PROGRAM_KEYPAIR_PATH to an absolute path.",
            path.display()
        )
    });

    let nums: Vec<u8> =
        serde_json::from_slice(&data).expect("Keypair JSON must be an array of 64 numbers");
    assert!(nums.len() >= 64, "Keypair JSON must contain 64 bytes");

    let pubkey_b58 = bs58::encode(&nums[32..64]).into_string();

    println!("cargo:rustc-env={var}={pubkey_b58}");
    println!(
        "cargo:warning=Injected {var}={pubkey_b58} from {}",
        path.display()
    );
}

#[macro_export]
macro_rules! inject_env {
    ($var:literal, $path:literal) => {{
        $crate::inject_program_id_env_from_keypair($var, $path);
    }};
}
