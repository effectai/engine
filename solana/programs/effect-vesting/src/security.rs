use nosana_common::security_txt;

/***
 * Security
 */

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Nosana Pools",
    project_url: "https://nosana.io",
    contacts: "email:security@nosana.io",
    policy: "https://github.com/nosana-ci/nosana-programs/blob/main/SECURITY.md",
    source_code: "https://github.com/nosana-ci/nosana-programs"
}
