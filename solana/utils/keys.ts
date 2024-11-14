
import {secp256k1} from '@noble/curves/secp256k1'
import { PublicKey } from '@solana/web3.js'

export function getPublic(privkey: Uint8Array, type: string) {
    const pubKey = secp256k1.getPublicKey(privkey)
    return new Uint8Array(pubKey)
}

export const getMetadataForPubkey = (pubkey: Uint8Array, programId: PublicKey) => {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), Buffer.from(`${pubkey.slice(0, 5)}${pubkey.slice(-5)}`)],
        programId
    )
}