import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration";
import { PrivateKey } from "@wharfkit/antelope";
import { initializeVaultAccount } from "../utils/anchor";
import { createMint, createTokenAccount, mintToAccount } from "../utils/spl";
import { type PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { AccountLayout } from "@solana/spl-token";
import { keccak256 } from "viem";
import { secp256k1 } from '@noble/curves/secp256k1';

describe("solana_efx_airdrop", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.SolanaSnapshotMigration as Program<SolanaSnapshotMigration>;
  const provider = anchor.AnchorProvider.env();
  const wallet = provider.wallet;
  // Get the keypair associated with the wallet
  const keypair = (wallet as anchor.Wallet).payer;

  let mint: PublicKey;
  let token_account: PublicKey;
  let metadataPubKey: PublicKey;
  let vaultPubKey: PublicKey;

  // airdrop some sol and create a dummy mint and token account
  before(async () => {
    // air drop some SOL
    await provider.connection.requestAirdrop(
      keypair.publicKey,
      1000000000000
    );

    const { publicKey, connection } = anchor.getProvider()
    mint = await createMint(
      connection,
      keypair,
      publicKey,
      6
    )

    // create a token account for the new mint
    token_account = await createTokenAccount(connection, keypair, mint, keypair.publicKey)

    // mint some tokens to the account
    await mintToAccount(connection, keypair, mint, token_account, keypair, 500)
  })

  it('correctly initializes', async () => {
    const privateKey = PrivateKey.from(
      "5KPm6mVzGWgvBv2aYf5e4izCfSK69KW5NKSS2XVm6YQ3g2pfQpw"
    )

    const { metadata, vaultAccount } = await initializeVaultAccount({
      // 33 bytes public key
      foreignPubKey: Buffer.from(privateKey.toPublic().data.array),
      mint,
      payer: keypair,
      payerTokens: token_account,
      amount: 100
    })

    metadataPubKey = metadata.publicKey
    vaultPubKey = vaultAccount

    const metadataAccount = await provider.connection.getAccountInfo(metadataPubKey)
    const vaultAccountInfo = await provider.connection.getAccountInfo(vaultPubKey)

    const data = AccountLayout.decode(vaultAccountInfo.data)

    expect(metadataAccount).to.not.be.null

    expect(vaultAccountInfo).to.not.be.null

    expect(data.mint.toBase58()).to.eql(mint.toBase58())
    expect(data.amount).to.eql(BigInt(100))
  })

  it("Can claim an airdrop", async () => {
    const privateKey = PrivateKey.from(
      "5KPm6mVzGWgvBv2aYf5e4izCfSK69KW5NKSS2XVm6YQ3g2pfQpw"
    )

    const message = "testing"
    const sig = privateKey.signMessage(Buffer.from(message))

    const tx = await program.methods.claim(
      Buffer.from(sig.data.array),
      Buffer.from(message),
      false
    ).accounts({
      recipientTokens: token_account,
      metadataAccount: metadataPubKey,
      vaultAccount: vaultPubKey,
      payer: keypair.publicKey,
    })
      .signers([keypair])
      .rpc()
  });


  it("initializes & claims an BSC public key", async () => {
    const ethPrivateKey = "dec08ffda7d9addd59809371399f1fb359392c1ad5a876d52449d8e840f7d636"
    const pk = secp256k1.getPublicKey(ethPrivateKey, true)

    const { metadata, vaultAccount } = await initializeVaultAccount({
      // 33 bytes public key
      foreignPubKey: pk,
      mint,
      payer: keypair,
      payerTokens: token_account,
      amount: 100
    })

    const metadataPubKey = metadata.publicKey
    const vaultPubKey = vaultAccount

    const metadataAccount = await provider.connection.getAccountInfo(metadataPubKey)
    const vaultAccountInfo = await provider.connection.getAccountInfo(vaultPubKey)

    const data = AccountLayout.decode(vaultAccountInfo.data)
    expect(metadataAccount).to.not.be.null
    expect(data.mint.toBase58()).to.eql(mint.toBase58())
    expect(data.amount).to.eql(BigInt(100))

    const message = "testing"

    // keccak256 hash of the message
    const keccakHash = keccak256(Buffer.from(message))
   
    // sign the hash
    const sig = secp256k1.sign(keccakHash.slice(2), ethPrivateKey)
   
    // add the recovery byte to the signature
    const sigWithRecovery = Buffer.concat([sig.toCompactRawBytes(), Buffer.from([sig.recovery + 27])])

    const tx = await program.methods.claim(
      sigWithRecovery,
      Buffer.from(message),
      true
    ).accounts({
      recipientTokens: token_account,
      metadataAccount: metadataPubKey,
      vaultAccount: vaultPubKey,
      payer: keypair.publicKey,
    })
      .signers([keypair])
      .rpc()
  })

});
