import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration";
import { initializeVaultAccount } from "../utils/anchor";
import { setup } from "../utils/spl";
import type { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { keccak256, toBytes } from "viem";
import { secp256k1 } from '@noble/curves/secp256k1';
import { privateKeyToAccount } from 'viem/accounts';
import { compressEosPubkey, deriveMetadataAndVaultFromPublicKey } from "../utils/keys";
import { PrivateKey, Transaction, TransactionHeader } from '@wharfkit/antelope';
import { ABICache, Action, Session } from '@wharfkit/session';
import { WalletPluginPrivateKey } from '@wharfkit/wallet-plugin-privatekey';

describe("solana_efx_airdrop", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.SolanaSnapshotMigration as Program<SolanaSnapshotMigration>;
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  // Get the keypair associated with the wallet
  const payer = (wallet as anchor.Wallet).payer;
  const originalMessage = `Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ${payer.publicKey.toBase58()}`

  const publicKey1 = "0xA03E94548C26E85DBd81d93ca782A3449564C27f"

  let mint: PublicKey;
  let ata: PublicKey;

  before(async () => {
    const results = await setup(payer, provider.connection)
    mint = results.mint
    ata = results.ata
  })

  describe("Migration Contract: Initialization", () => {
    it('correctly initializes an ethereum based vault', async () => {
      await initializeVaultAccount({
        provider: provider,
        foreignPubKey: toBytes(publicKey1),
        mint,
        payer,
        payerTokens: ata,
        amount: 5
      })

      const { metadata } = deriveMetadataAndVaultFromPublicKey(payer.publicKey, toBytes(publicKey1), program.programId)

      // // check if the metadata account was created
      const metadataAccount = await provider.connection.getAccountInfo(metadata)
      expect(metadataAccount).to.not.be.null
    })

    it('correctly initializes a EOS based vault', async () => {
      const eosPublicKey = "PUB_K1_7abGp9AVsTpt4TLSdCFKS2Tm49zCwg8nWLpJhAmEpppG9fjJsy"
      const publicKey = compressEosPubkey(eosPublicKey)

      await initializeVaultAccount({
        provider: provider,
        foreignPubKey: publicKey,
        mint,
        payer,
        payerTokens: ata,
        amount: 5
      })
    })

    it('correctly throws an error when the foreign public key is invalid', async () => { })
    it('correctly throws an error when the mint is invalid', async () => { })
    it('correctly throws an error when the ata is invalid', async () => { })
    it('correctly throws an error when the amount is invalid', async () => { })
    it('errors when account already exists', () => {

    })
  })


  describe("Migration Contract: Signing & Claiming", () => {

    it('correctly claims with an eos signature', async () => {
      const eosPrivatekey = PrivateKey.from("5K5UuCj9PmMSFTyiWzTtPF4VmUftVqScM3QJd9HorrZGCt4LgLu")

      const eosPublicKey = eosPrivatekey.toPublic()
      const pk = compressEosPubkey(eosPublicKey.toString())

      const { metadata, vault } = deriveMetadataAndVaultFromPublicKey(payer.publicKey, pk, program.programId)

      const session = new Session({
        permissionLevel: {
          actor: "effectai",
          permission: "active"
        },
        chain: {
            id: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
            url: "https://eos.greymass.com",
        },
        walletPlugin: new WalletPluginPrivateKey("5K5UuCj9PmMSFTyiWzTtPF4VmUftVqScM3QJd9HorrZGCt4LgLu")
      })

      const abi = new ABICache(session.client);
      const eosAbi = await abi.getAbi('eosio.token')
  
      const action = Action.from({
        account: 'effecttokens',
        name: 'issue',
        authorization: [{
          actor: 'effectai',
          permission: 'active',
        }],
        data: {
          to: 'effectai',
          quantity: '0 EFX',
          memo: originalMessage,
        }
      }, eosAbi)

      // serialize the transaction
      const txHeader = TransactionHeader.from({
        expiration:0,
        ref_block_num: 11,
        ref_block_prefix: 32,
        delay_sec: 0,
      })

      const tx = Transaction.from({
        actions: [action],
        ...txHeader
      });

      const serializedTransactionBytes = tx.signingData("aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906")

      const signature = await session.signTransaction(tx)

      await program.methods.unlockEos(
        Buffer.from(signature[0].data.array),
        Buffer.from(serializedTransactionBytes.array),
      ).accounts({
        metadataAccount: metadata,
        vaultAccount: vault,
        recipientTokens: ata,
        payer: payer.publicKey,
      })
        .signers([payer])
        .rpc()
    })

    it('correctly signs with keccak256', async () => {
      const ethPrivateKey = "d09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5"

      // keccak256 hash of the message
      const keccakHash = keccak256(Buffer.from(originalMessage))

      // sign the hash
      const sig = secp256k1.sign(keccakHash.slice(2), ethPrivateKey)

      // add the recovery byte to the signature
      const sigWithRecovery = Buffer.concat([sig.toCompactRawBytes(), Buffer.from([sig.recovery + 27])])

      const { metadata, vault } = deriveMetadataAndVaultFromPublicKey(payer.publicKey, toBytes(publicKey1), program.programId)

      await program.methods.unlockEth(
        sigWithRecovery,
        Buffer.from(originalMessage),
      ).accounts({
        metadataAccount: metadata,
        recipientTokens: ata,
        payer: payer.publicKey,
        vaultAccount: vault
      })
        .signers([payer])
        .rpc()
    })

    it('correctly claims with eth_personal_sign', async () => {
      const account = privateKeyToAccount("0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5")
      const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`
      const message = prefix + originalMessage
      
      const signature = await account.signMessage({ message: originalMessage })

      // const pk = secp256k1.getPublicKey(account.address.slice, true)
      const { metadata, vault } = deriveMetadataAndVaultFromPublicKey(payer.publicKey, toBytes(publicKey1), program.programId)

      await program.methods.unlockEth(
        Buffer.from(toBytes(signature)),
        Buffer.from(message),
      ).accounts({
        recipientTokens: ata,
        metadataAccount: metadata,
        vaultAccount: vault,
        payer: payer.publicKey,
      })
        .signers([payer])
        .rpc()
    })

    it('correctly throws an error when the message is incorrect', async () => {
    })

    it('correctly throws an error when the signature is incorrect', async () => {
    })

  })
});
