
import {secp256k1} from '@noble/curves/secp256k1'
import { PUBLIC_KEY_LENGTH, PublicKey } from '@solana/web3.js'
import { Base58 } from '@wharfkit/antelope'

export function getPublic(privkey: Uint8Array, type: string) {
    const pubKey = secp256k1.getPublicKey(privkey)
    return new Uint8Array(pubKey)
}

export const deriveMetadataAndVaultFromPublicKey = (foreignPubKey: Uint8Array, programId: PublicKey) => {
    const [metadata] = PublicKey.findProgramAddressSync(
        [foreignPubKey],
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
    if (!eosPubkey.startsWith("EOS")) {
        throw new Error("Invalid EOS public key prefix");
    }
    
    // Remove "EOS" prefix
    const base58Key = eosPubkey.slice(3); 

    // Step 2: Decode from Base58
    const decoded = Base58.decode(base58Key);
    if (decoded.length !== 37) {
        throw new Error("Invalid EOS public key length after Base58 decoding");
    }

    // Step 3: Split the key and checksum
    const keyBytes = decoded.array.slice(0, 33); // Compressed key (33 bytes)

    // remove first byte (0x02 or 0x03)
    return keyBytes.slice(1);
}