// deploy script for local environment
import * as anchor from '@coral-xyz/anchor'
import { initializeVaultAccount } from '../utils/anchor'
import { setup } from '../utils/spl'
import { hexToBytes } from '@noble/curves/abstract/utils'
import { compressEosPubkey } from '../utils/keys'

const seed = async () => {
    const anchorWallet = process.env.ANCHOR_WALLET

    if (!anchorWallet) {
        throw new Error('ANCHOR_WALLET env variable is not set')
    }

    // load anchor wallet
    const provider = anchor.AnchorProvider.local();

    const wallet = provider.wallet;
    const payer = (wallet as anchor.Wallet).payer;

    const {mint, ata} = await setup(payer, provider.connection);
    console.log("payer", payer.publicKey.toBase58())

    const ethPublicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";
    const eosPublicKey = compressEosPubkey("PUB_K1_64vP1Y18ZJXP7KSGoQG8pgR3imaAWoBhzH77kYmYXuVnx9KXxH")
    console.log(eosPublicKey)

    await initializeVaultAccount({
        foreignPubKey: eosPublicKey,
        mint,
        payer,
        payerTokens: ata,
        amount: 10
    })

    // await initializeVaultAccount({
    //     foreignPubKey: hexToBytes(ethPublicKey),
    //     mint,
    //     payer,
    //     payerTokens: ata,
    //     amount: 10
    // })

    console.log("payer", payer.publicKey.toBase58())
    console.log('ata', ata.toBase58())
    console.log("mint", mint.toBase58())
}


seed()