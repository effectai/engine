import { it, describe, expect } from "vitest";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { AnchorProvider, type Idl, Program } from "@coral-xyz/anchor";
import type { EffectStaking } from "../../target/types/effect_staking.js";
import IDL from "../../target/idl/effect_staking.json";
import { setup } from "../../utils/spl.js";
import { BN } from "bn.js";
const SECONDS_PER_DAY = 24 * 60 * 60;

import {deriveStakingAccounts} from '@effectai/staking'
import { Connection, Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { MintLayout, TOKEN_PROGRAM_ID, createInitializeMintInstruction } from "@solana/spl-token";

describe("bankrun", async () => {
    const context = await startAnchor('./', [], []);
    const provider = new BankrunProvider(context);
    const effectStaking = new Program(
        IDL as Idl,
        provider
    ) as unknown as Program<EffectStaking>;


    it('should create a mint',  async () => {
        const mint = Keypair.generate();
        const connection = new Connection('http://localhost:8899');
        const lamports = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
    
        const transaction = new Transaction().add(
            SystemProgram.createAccount({
                fromPubkey: provider.wallet.payer.publicKey,
                newAccountPubkey: mint.publicKey,
                space: MintLayout.span,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeMintInstruction(mint.publicKey, 6, provider.wallet.payer.publicKey, null, TOKEN_PROGRAM_ID)
        );
    
        if(!provider.sendAndConfirm){
            throw new Error('sendAndConfirm not implemented')
        }

        const tx = await provider.sendAndConfirm(transaction, [provider.wallet.payer, mint]);
        console.log(tx)
    })

    it("should stake, unstake, wait 14 days, and withdraw", async () => {
        const { mint, ata } = await setup({payer: provider.wallet.payer, provider: provider});
        const amount = 1000;

        await effectStaking.methods.stake(new BN(amount), new BN(14 * SECONDS_PER_DAY )).accounts({
            stakerTokens: ata,
            mint,
            authority: provider.wallet.publicKey,
        }).rpc();

        const {stakeAccount, vaultAccount} = await deriveStakingAccounts({mint, stakerAddress: provider.wallet.publicKey, programId: effectStaking.programId})

        // check if stakingAccount exists
        const account = await provider.connection.getAccountInfo(stakeAccount)
        expect(account).not.toBe(null)

        // check if vault exists
        const vault = await provider.connection.getAccountInfo(vaultAccount)
        expect(vault).not.toBe(null)

        // unstake
        await effectStaking.methods.unstake().accounts({
            stake: stakeAccount,
        }).rpc();

        // wait 14 days
        context.warpToSlot(500n)

    })
})