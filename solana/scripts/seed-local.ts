// deploy script for local environment
import * as anchor from "@coral-xyz/anchor";
import { initializeVaultAccount } from "../utils/anchor";
import { mintToAccount, setup } from "../utils/spl";
import { toBytes } from "viem";
import { PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccount } from "@solana/spl-token";
import rewardIDL from "../target/idl/effect_rewards.json";
import { EffectRewards } from "../target/types/effect_rewards";
import { Program } from "@coral-xyz/anchor";

const createReflectionAcount = async ({ mint }: { mint: PublicKey }) => {
	// load anchor wallet
	const provider = anchor.AnchorProvider.local();

	const program = new anchor.Program(
		rewardIDL as anchor.Idl,
		provider,
	) as unknown as Program<EffectRewards>;

	await program.methods
		.init()
		.accounts({
			mint,
		})
		.rpc();

    const [reflectionVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault")],
        program.programId
    ) 

    const [reflectionAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("reflection")],
        program.programId
    ) 
        
    return [
        reflectionAccount,
        reflectionVault
    ]
};

const seed = async () => {
	const anchorWallet = process.env.ANCHOR_WALLET;

	if (!anchorWallet) {
		throw new Error("ANCHOR_WALLET env variable is not set");
	}
	const provider = anchor.AnchorProvider.local();

	await provider.connection.requestAirdrop(
		provider.wallet.publicKey,
		1000000000000,
	);
	const tx = await provider.connection.requestAirdrop(
		new PublicKey("dumQVNHZ1KNcLmzjMaDPEA5vFCzwHEEcQmZ8JHmmCNH"),
		1000000000000,
	);
	await provider.connection.confirmTransaction(tx);

	const wallet = provider.wallet;
	const payer = (wallet as anchor.Wallet).payer;

	const { mint, ata } = await setup({ payer, provider });

    console.log("mint", mint.toBase58())

	// also mint some tokens to the dummy account for staking
	const dummyAta = await createAssociatedTokenAccount(
		provider.connection,
		payer,
		mint,
		new PublicKey("dumQVNHZ1KNcLmzjMaDPEA5vFCzwHEEcQmZ8JHmmCNH"),
	);

	await mintToAccount({
		payer,
		provider,
		mint,
		destination: dummyAta,
		mintAuthority: payer,
		amount: 1000000000,
	});

	// create reflection account
	const [reflectionAccount, reflectionVault] = await createReflectionAcount({mint});

    // put some tokens on the reflection vault
    await mintToAccount({
        payer,
        provider,
        mint,
        destination: reflectionVault,
        mintAuthority: payer,
        amount: 1000000000
    })

    console.log("reflection vault", reflectionVault.toBase58())
    console.log("reflectionAccount", reflectionAccount.toBase58())

	// // create associated token account
	// const jeffAta = await createAssociatedTokenAccount(provider.connection, payer, mint, new PublicKey("jeffCRA2yFkRbuw99fBxXaqE5GN3DwjZtmjV18McEDf"))

	// await mintToAccount({
	//     payer,
	//     provider,
	//     mint,
	//     destination: jeffAta,
	//     mintAuthority: payer,
	//     amount: 1000000000
	// })

	// const ethPublicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";
	// const eosPublicKey = extractEosPublicKeyBytes("PUB_K1_64vP1Y18ZJXP7KSGoQG8pgR3imaAWoBhzH77kYmYXuVnx9KXxH")

	// await initializeVaultAccount({
	//     foreignPubKey: eosPublicKey,
	//     mint,
	//     payer,
	//     payerTokens: ata,
	//     amount: 100000
	// })

	// await initializeVaultAccount({
	//     foreignPubKey: toBytes(ethPublicKey),
	//     mint,
	//     payer,
	//     payerTokens: ata,
	//     amount: 100000
	// })

	// console.log("payer", payer.publicKey.toBase58())
	// console.log('ata', ata.toBase58())
	// console.log("mint", mint.toBase58())
};

seed();
