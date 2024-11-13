import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration";
import { Checksum256, PrivateKey } from "@wharfkit/antelope";
import { initializeVaultAccount } from "../utils/anchor";
import { createMint, createTokenAccount, mintToAccount } from "../utils/spl";
import { ComputeBudgetProgram, type PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { AccountLayout } from "@solana/spl-token";

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

    token_account = await createTokenAccount(connection, keypair, mint, keypair.publicKey)
    // mint some tokens to the account
    await mintToAccount(connection, keypair, mint, token_account, keypair, 500)
  })

  it('correctly initializes', async () => {
    const privateKey = PrivateKey.from(
      "5KPm6mVzGWgvBv2aYf5e4izCfSK69KW5NKSS2XVm6YQ3g2pfQpw"
    )

    const message = "testing"
    const sig = privateKey.signMessage(Buffer.from(message))

    const { metadata, vaultAccount } = await initializeVaultAccount({
      foreignPubKey: Buffer.from(privateKey.toPublic().data.array),
      mint,
      payer: keypair,
      payerTokens: token_account,
      amount: 100
    })

    // verify that the metadata and vault accounts are created
    // and that the vault account holds the correct amount of tokens

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
      Buffer.from(Checksum256.hash(Buffer.from(message)).array),
    ).accounts({
      recipientTokens: token_account,
      metadataAccount: metadataPubKey,
      vaultAccount: vaultPubKey,
      payer: keypair.publicKey,
    })
      .signers([keypair])
      .rpc()
  });
});
