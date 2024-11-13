
import {secp256k1} from '@noble/curves/secp256k1'

export function getPublic(privkey: Uint8Array, type: string) {
    const pubKey = secp256k1.getPublicKey(privkey)
    return new Uint8Array(pubKey)
}
