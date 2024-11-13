import type { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import type { SolanaSnapshotMigration } from "../target/types/solana_snapshot_migration";
import { type Keypair, PublicKey } from "@solana/web3.js";
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

    const metadata = anchor.web3.Keypair.generate();

    const [vaultAccount, _] = PublicKey.findProgramAddressSync(
        [metadata.publicKey.toBuffer()],
        program.programId
    );

    const tx = await program.methods.initialize(
        Buffer.from(foreignPubKey),
        new BN(amount),
    ).accounts({
        payer: payer.publicKey,
        payerTokens,
        metadata: metadata.publicKey,
        mint,
    }).signers([metadata, payer]).rpc()

    return {
        metadata,
        vaultAccount
    }

}