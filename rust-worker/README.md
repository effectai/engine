
Demonstration of a libp2p Effect worker implementation in Rust.

##  Building

This example uses Guix. Building on other operating systems should be
straight forward.

To get the latest version of Rust, add the [`guix-rustup`
channel](https://github.com/declantsien/guix-rustup) to Guix, which
is based on the binary releases provided by the Rust team.

To start an isolated guix shell with all required dependencies:

```
guix shell -N -C -F -e '((@@ (rustup build toolchain) rustup) "stable")' coreutils nss-certs 
gcc-toolchain protobuf libgccjit
```

Then just `cargo build`

