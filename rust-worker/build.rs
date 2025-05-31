fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:warning=OUT_DIR is: {}", std::env::var("OUT_DIR").unwrap());
    prost_build::compile_protos(&["proto/messages.proto"], &["proto/"])?;
    Ok(())
}
