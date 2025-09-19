use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, LitStr};

/// Usage:
/// inject_declare_id_output!("../../target/deploy/your_program-keypair.json");
///
/// Behavior:
/// - If ANCHOR_PROGRAM_ID is set in the build env, use that as the ID.
/// - Otherwise, read the given keypair JSON file (Vec<u8> of length 64)
///   and take the last 32 bytes as the public key, base58-encode it,
///   and expand to `anchor_lang::declare_id!("...");`
///
/// The path is resolved relative to CARGO_MANIFEST_DIR (the crate where the macro is used).
#[proc_macro]
pub fn inject_declare_id_output(input: TokenStream) -> TokenStream {
    let lit = parse_macro_input!(input as LitStr);
    let path_literal = lit.value();

    if let Ok(env_pk) = std::env::var("ANCHOR_PROGRAM_ID") {
        if env_pk.trim().is_empty() {
            return compile_error("ANCHOR_PROGRAM_ID is set but empty");
        }
        return expand_declare_id(&env_pk);
    }

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap_or_else(|_| ".".to_string());
    let path = std::path::Path::new(&manifest_dir).join(&path_literal);

    let file_str = match std::fs::read_to_string(&path) {
        Ok(s) => s,
        Err(e) => {
            return compile_error(&format!(
                "Failed to read keypair JSON at '{}': {}",
                path.display(),
                e
            ));
        }
    };

    let bytes: Vec<u8> = match serde_json::from_str(&file_str) {
        Ok(v) => v,
        Err(e) => {
            return compile_error(&format!(
                "Keypair JSON must be an array of 64 bytes. Parse error: {}",
                e
            ));
        }
    };

    if bytes.len() != 64 {
        return compile_error(&format!(
            "Expected 64-byte array for keypair, got length {}",
            bytes.len()
        ));
    }

    let pubkey_b58 = bs58::encode(&bytes[32..]).into_string();
    expand_declare_id(&pubkey_b58)
}

fn expand_declare_id(pk: &str) -> TokenStream {
    let pk_lit = proc_macro2::Literal::string(pk);
    let ts = quote! {
        ::anchor_lang::declare_id!(#pk_lit);
    };
    ts.into()
}

fn compile_error(msg: &str) -> TokenStream {
    let m = proc_macro2::Literal::string(msg);
    let ts = quote! { compile_error!(#m); };
    ts.into()
}
