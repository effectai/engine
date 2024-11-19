
import {secp256k1} from '@noble/curves/secp256k1'
import { PUBLIC_KEY_LENGTH, PublicKey } from '@solana/web3.js'
import { Base58 } from '@wharfkit/antelope'

export function getPublic(privkey: Uint8Array, type: string) {
    const pubKey = secp256k1.getPublicKey(privkey)
    return new Uint8Array(pubKey)
}
