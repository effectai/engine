import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration";
import type { Keypair, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

export const initializeVaultAccount = async ({
    foreignPubKey,
    mint,
    amount,
    payer,
    payerTokens
}: {
    foreignPubKey: Uint8Array,
    mint: PublicKey
    amount: number,
    payerTokens: PublicKey
    payer: Keypair,
}) => {
    const program = anchor.workspace.SolanaSnapshotMigration as Program<SolanaSnapshotMigration>;

    await program.methods.create(
        Buffer.from(foreignPubKey),
        new BN(amount),
    ).accounts({
        payer: payer.publicKey,
        payerTokens,
        mint,
    }).signers([payer]).rpc()
}