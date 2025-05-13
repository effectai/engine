use effect_common::security_txt;

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Effect Payment",
    project_url: "https://effect.ai",
    contacts: "email:security@effect.ai",
    policy: "https://github.com/effectai/effect-tasks/blob/main/solana/SECURITY.md",
    source_code: "https://github.com/effectai/effect-tasks/solana"
}
