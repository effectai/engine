use effect_common::security_txt;

/***
 * Security
 */

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Effect Vesting",
    project_url: "https://effect.ai",
    contacts: "email:security@effect.ai",
    // TODO:: Add the correct security policy and source code links
    policy: "https://github.com/nosana-ci/nosana-programs/blob/main/SECURITY.md",
    source_code: "https://github.com/nosana-ci/nosana-programs"
}
