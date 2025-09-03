pub fn u64_to_32_byte_be_array(value: u64) -> [u8; 32] {
    let mut result = [0u8; 32];
    let value_bytes = value.to_be_bytes();
    result[24..].copy_from_slice(&value_bytes);
    result
}

pub fn u32_to_32_byte_be_array(value: u32) -> [u8; 32] {
    let mut result = [0u8; 32];
    let value_bytes = value.to_be_bytes();
    result[28..].copy_from_slice(&value_bytes);
    result
}

pub fn change_endianness(bytes: &[u8]) -> Vec<u8> {
    let mut vec = Vec::new();
    for b in bytes.chunks(32) {
        for byte in b.iter().rev() {
            vec.push(*byte);
        }
    }
    vec
}
