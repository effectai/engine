
import {secp256k1} from '@noble/curves/secp256k1'
import { PUBLIC_KEY_LENGTH, PublicKey } from '@solana/web3.js'
import { Base58 } from '@wharfkit/antelope'

export function getPublic(privkey: Uint8Array, type: string) {
    const pubKey = secp256k1.getPublicKey(privkey)
    return new Uint8Array(pubKey)
}

export const deriveMetadataAndVaultFromPublicKey = (payer: PublicKey, foreignPubKey: Uint8Array, programId: PublicKey) => {
    const [metadata] = PublicKey.findProgramAddressSync(
        [payer.toBuffer(), foreignPubKey],
        programId
    )
    const [vault] = PublicKey.findProgramAddressSync(
        [metadata.toBuffer()],
        programId
    )
    return { metadata, vault }
}   


export function compressEosPubkey(eosPubkey: string): Uint8Array | null {
    // Step 1: Check and remove the "EOS" prefix
    if (!eosPubkey.startsWith("EOS") && !eosPubkey.startsWith("PUB_K1_")) {
        throw new Error("Invalid EOS public key prefix");
    }
    
    // Remove "EOS" or PUB_K1 prefix
    let base58Key: string;
    
    // Step 1: Remove the correct prefix
    if (eosPubkey.startsWith("EOS")) {
        base58Key = eosPubkey.slice(3); // Remove "EOS" prefix
    } else if (eosPubkey.startsWith("PUB_K1_")) {
        base58Key = eosPubkey.slice(7); // Remove "PUB_K1_" prefix
    } else {
        throw new Error("Unsupported key format");
    }

    // Step 2: Decode from Base58
    const decoded = Base58.decode(base58Key);
    if (decoded.length !== 37) {
        throw new Error("Invalid EOS public key length after Base58 decoding");
    }

    // remove checksum (last 4 bytes)
    const keyBytes = decoded.array.slice(0, 33); // Compressed key (33 bytes)

    // remove first byte (0x02 or 0x03)
    return keyBytes.slice(1);
}