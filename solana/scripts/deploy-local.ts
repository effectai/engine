// deploy script for local environment
import * as anchor from "@coral-xyz/anchor";
import { mintToAccount, setup } from "../utils/spl";
import { toBytes } from "viem";
import { PublicKey } from "@solana/web3.js";
import { createAssociatedTokenAccount } from "@solana/spl-token";
import rewardIDL from "../target/idl/effect_rewards.json";
import type { EffectRewards } from "../target/types/effect_rewards";
import type { Program } from "@coral-xyz/anchor";
import { spawn } from "child_process";
import { createKeypairFromFile, extractEosPublicKeyBytes, useDeriveMigrationAccounts } from "@effectai/utils";
import { createMigrationClaim } from "../utils/migration";
import type { EffectMigration } from "../target/types/effect_migration";

const createReflectionAcount = async ({
	mint,
	ata,
}: { mint: PublicKey; ata: PublicKey }) => {
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
		program.programId,
	);

	const [reflectionAccount] = PublicKey.findProgramAddressSync(
		[Buffer.from("reflection")],
		program.programId,
	);

	return [reflectionAccount, reflectionVault];
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

	const mintKeypair = await createKeypairFromFile("./tests/keys/mint44RzfitV8sqFGrLnh6sLNAS2jxaw1KhaSsYGT3P.json");

	const { mint, ata } = await setup({ payer, provider, amount: 5000_000_000, mintKeypair });

	// also mint some tokens to the dummy account for staking
	const dummyAta = await createAssociatedTokenAccount(
		provider.connection,
		payer,
		mint,
		new PublicKey("dumQVNHZ1KNcLmzjMaDPEA5vFCzwHEEcQmZ8JHmmCNH"),
	);

	// mint some tokens to the dummy account
	await mintToAccount({
		payer,
		provider,
		mint,
		destination: dummyAta,
		mintAuthority: payer,
		amount: 1500_000_000,
	});

	// create reflection account
	const [reflectionAccount, reflectionVault] = await createReflectionAcount({
		mint,
		ata,
	});

	const ethereumPublicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";
	const eosPublicKey = "EOS64vP1Y18ZJXP7KSGoQG8pgR3imaAWoBhzH77kYmYXuVnwzGaDf";
	const eosPublicKeyBytes = extractEosPublicKeyBytes(eosPublicKey);

	if(!eosPublicKeyBytes) {
		throw new Error("Invalid eos public key");
	}

	const program = anchor.workspace.EffectMigration as Program<EffectMigration>;


	const dateOneYearAgo = new Date().getTime() / 1000 - 365 * 24 * 60 * 60;
	
	await createMigrationClaim({
		program,
		publicKey: toBytes(ethereumPublicKey),
		mint,
		amount: 250_000_000,
		userTokenAccount: ata,
		stakeStartTime: dateOneYearAgo,
	});

	console.log("mint", mint.toBase58());
};

// deploy
const args1 = [
	"deploy",
	"--provider.cluster",
	"localnet",
]

// start a new ledger
const deploy = (command: string, args: string[]): Promise<void> => {
	return new Promise((resolve, reject) => {
		const deploy = spawn(command, args);

		deploy.stdout.on("data", (data) => {
			console.log(`stdout: ${data}`);
		});

		deploy.stderr.on("data", (data) => {
			console.error(`stderr: ${data}`);
		});

		deploy.on("close", (code) => {
			if (code === 0) {
				console.log(`child process exited with code ${code}`);
				resolve();
			} else {
				reject(new Error(`child process exited with code ${code}`));
			}
		});

		deploy.on("error", (err) => {
			reject(err); // In case spawn fails to start the process
		});
	});
};

// kill current solana-test-validator
try {
	console.log("killing current solana-test-validator");
	await new Promise((resolve, reject) => {
		const deploy = spawn("killall", ["solana-test-validator"]);

		deploy.stdout.on("data", (data) => {
			console.log(`stdout: ${data}`);
			resolve(void 0);
		});

		deploy.stderr.on("data", (data) => {
			console.error(`stderr: ${data}`);
		});

		deploy.on("close", (code) => {
			if (code === 0) {
				console.log(`child process exited with code ${code}`);
				resolve(void 0);
			} else {
				reject(new Error(`child process exited with code ${code}`));
			}
		});

		deploy.on("error", (err) => {
			reject(err); // In case spawn fails to start the process
		});
	});
} catch (e) {
	console.log(e);
}

await new Promise((resolve, reject) => {
	const deploy = spawn("solana-test-validator", ["--quiet", "--reset"]);

	deploy.stdout.on("data", (data) => {
		console.log(`stdout: ${data}`);
		resolve(void 0);
	});

	deploy.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});

	deploy.on("close", (code) => {
		if (code === 0) {
			console.log(`child process exited with code ${code}`);
			resolve(void 0);
		} else {
			reject(new Error(`child process exited with code ${code}`));
		}
	});

	deploy.on("error", (err) => {
		reject(err); // In case spawn fails to start the process
	});
});

// wait for the programs to deploy
await Promise.all([
	deploy("anchor", args1),
]);

// seed the accounts
await seed();
