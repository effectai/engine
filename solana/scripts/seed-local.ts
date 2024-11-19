// deploy script for local environment
import * as anchor from '@coral-xyz/anchor'
import { initializeVaultAccount } from '../utils/anchor'
import { setup } from '../utils/spl'
import { toBytes } from 'viem'
import { extractEosPublicKeyBytes} from '@effectai/utils'

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

    const ethPublicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";
    const eosPublicKey = extractEosPublicKeyBytes("PUB_K1_64vP1Y18ZJXP7KSGoQG8pgR3imaAWoBhzH77kYmYXuVnx9KXxH")

    await initializeVaultAccount({
        foreignPubKey: eosPublicKey,
        mint,
        payer,
        payerTokens: ata,
        amount: 100000
    })

    await initializeVaultAccount({
        foreignPubKey: toBytes(ethPublicKey),
        mint,
        payer,
        payerTokens: ata,
        amount: 100000
    })

    console.log("payer", payer.publicKey.toBase58())
    console.log('ata', ata.toBase58())
    console.log("mint", mint.toBase58())
}


seed()