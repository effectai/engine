import { Keypair, type PublicKey } from "@solana/web3.js";
import type * as anchor from "@coral-xyz/anchor";
import { BN } from "bn.js";
import { SECONDS_PER_DAY } from "../tests/helpers";
import { useDeriveStakeAccounts } from "@effectai/utils";
import type { EffectStaking } from "../target/types/effect_staking";

export const createStake = async ({
    amount,
    program,
    mint,
    payer,
    payerTokens,
}: {
    amount: number;
    program: anchor.Program<EffectStaking>;
    mint: PublicKey;
    payer: Keypair;
    payerTokens: PublicKey;
}) => {
    const stakeAccount = new Keypair();

    await program.methods.stake(new BN(amount), new BN(30 * SECONDS_PER_DAY)).accounts({
        authority: payer.publicKey,
        mint,
        stake: stakeAccount.publicKey,
        userTokenAccount: payerTokens,
    }).signers([stakeAccount])
    .rpc();

    const { vaultAccount } = useDeriveStakeAccounts({
        stakingAccount: stakeAccount.publicKey,
        programId: program.programId,
    });

    return { stakeAccount, vaultAccount };
}