// deploy script for local environment
import * as anchor from '@coral-xyz/anchor'
import { initializeVaultAccount } from '../utils/anchor'
import { setup } from '../utils/spl'
import { hexToBytes } from '@noble/curves/abstract/utils'

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

    const foreignPubKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";

    const {metadata} = await initializeVaultAccount({
        foreignPubKey: Buffer.from(hexToBytes(foreignPubKey.substring(2))),
        mint,
        provider,
        payer,
        amount: 100,
        payerTokens: ata    
    })

    console.log('ata', ata.toBase58())
    console.log('metadata', metadata.publicKey.toBase58())
    console.log("mint", mint.toBase58())
}


seed()