import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration";
import { PrivateKey } from "@wharfkit/antelope";
import { initializeVaultAccount } from "../utils/anchor";
import { createMint, createTokenAccount, mintToAccount, setup } from "../utils/spl";
import type { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { AccountLayout } from "@solana/spl-token";
import { keccak256, toBytes } from "viem";
import { secp256k1 } from '@noble/curves/secp256k1';
import { privateKeyToAccount } from 'viem/accounts'


describe("solana_efx_airdrop", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.SolanaSnapshotMigration as Program<SolanaSnapshotMigration>;
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  // Get the keypair associated with the wallet
  const payer = (wallet as anchor.Wallet).payer;

  let mint: PublicKey;
  let ata: PublicKey;
  let metadataPubKey: PublicKey;
  let vaultPubKey: PublicKey;

  before(async () => {
    // create a new mint and token_account
    const results = await setup(payer, provider.connection)
    mint = results.mint
    ata = results.ata
  })

  describe("Validates BSC Signing", () => {
    let metadataPubKey: PublicKey
    let vaultPubKey: PublicKey

    beforeEach(async () => {
      // create a new metadata account
    })

    it('correctly signs with keccak256', async () => {
      const ethPrivateKey = "d09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5"
      const message = "Effect AI: Please sign this message to claim your tokens"

      // keccak256 hash of the message
      const keccakHash = keccak256(Buffer.from(message))

      // sign the hash
      const sig = secp256k1.sign(keccakHash.slice(2), ethPrivateKey)

      // add the recovery byte to the signature
      const sigWithRecovery = Buffer.concat([sig.toCompactRawBytes(), Buffer.from([sig.recovery + 27])])

      const publicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f"

      const { metadata, vaultAccount } = await initializeVaultAccount({
        // 33 bytes public key
        provider: provider,
        foreignPubKey: toBytes(publicKey),
        mint,
        payer,
        payerTokens: ata,
        amount: 10
      })

      const tx = await program.methods.claim(
        sigWithRecovery,
        Buffer.from(message),
        true
      ).accounts({
        recipientTokens: ata,
        metadataAccount: metadata.publicKey,
        vaultAccount: vaultAccount,
        payer: payer.publicKey,
      })
        .signers([payer])
        .rpc()

    })

    it('correctly claims with eth_personal_sign', async () => {
      const account = privateKeyToAccount("0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5")
      const originalMessage = "Effect AI: Please sign this message to claim your tokens"
      const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`
      const message = prefix + originalMessage
      const signature = await account.signMessage({ message: originalMessage })

      // const pk = secp256k1.getPublicKey(account.address.slice, true)
      const publicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f"

      const { metadata, vaultAccount } = await initializeVaultAccount({
        // 33 bytes public key
        provider: provider,
        foreignPubKey: toBytes(publicKey),
        mint,
        payer,
        payerTokens: ata,
        amount: 10
      })

      const tx = await program.methods.claim(
        Buffer.from(toBytes(signature)),
        Buffer.from(message),
        true
      ).accounts({
        recipientTokens: ata,
        metadataAccount: metadata.publicKey,
        vaultAccount: vaultAccount,
        payer: payer.publicKey,
      })
        .signers([payer])
        .rpc()
    })
  })
});
