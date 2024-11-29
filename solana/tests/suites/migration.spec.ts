import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";

import { keccak256, toBytes } from "viem";
import { secp256k1 } from "@noble/curves/secp256k1";
import { privateKeyToAccount } from "viem/accounts";

import {
	extractEosPublicKeyBytes
} from "@effectai/utils";

import { PrivateKey, Transaction, TransactionHeader } from "@wharfkit/antelope";
import { ABICache, Action, Session } from "@wharfkit/session";
import { WalletPluginPrivateKey } from "@wharfkit/wallet-plugin-privatekey";

import type { EffectMigration } from "../../target/types/effect_migration.js";

import { expect, describe, it } from "vitest";
import {
	useAnchor,
	useMigrationTestHelpers
} from "../helpers.js";
import { setup } from "../../utils/spl.js";
import type { EffectStaking } from "../../target/types/effect_staking.js";
import { useDeriveStakeAccounts } from "../../utils/derive.js";

describe("Migration Program", async () => {
	const program = anchor.workspace
		.EffectMigration as Program<EffectMigration>;

	const stakeProgram = anchor.workspace.EffectStaking as Program<EffectStaking>;

	const { provider, payer } = useAnchor();
	const { useCreateTokenClaim, useCreateStakeClaim } = useMigrationTestHelpers(program);

	// local test data
	const originalMessage = `Effect.AI: I confirm that I authorize my tokens to be claimed at the following Solana address: ${payer.publicKey.toBase58()}`;
	const ethPublicKey = "0xA03E94548C26E85DBd81d93ca782A3449564C27f";
	const eosPublicKey =
	"PUB_K1_7abGp9AVsTpt4TLSdCFKS2Tm49zCwg8nWLpJhAmEpppG9fjJsy";

	describe("Initialization", () => {
		it.concurrent("correctly initializes an ethereum based vault", async () => {
			const { mint, ata } = await setup({ provider, payer});

			const { tokenClaimAccount } = await useCreateTokenClaim({
				mint,
				payer,
				payerTokens: ata,
				publicKey: toBytes(ethPublicKey),
				provider,
			});

			// // check if the metadata account was created
			const metadataAccount =
				await provider.connection.getAccountInfo(tokenClaimAccount);

			expect(metadataAccount).to.not.be.null;
		});

		it.concurrent("correctly initializes a EOS based vault", async () => {
			const { mint, ata } = await setup({ provider, payer });
			
			const publicKey = extractEosPublicKeyBytes(eosPublicKey);

			if (!publicKey) {
				throw new Error("Invalid public key");
			}

			const { tokenClaimAccount } = await useCreateTokenClaim({
				mint,
				payer,
				payerTokens: ata,
				publicKey,
				provider,
			});

			const metadataAccount =
				await provider.connection.getAccountInfo(tokenClaimAccount);
			expect(metadataAccount).to.not.be.null;
		});

		it("correctly throws an error when the foreign public key is invalid", async () => {});
		it("correctly throws an error when the mint is invalid", async () => {});
		it("correctly throws an error when the ata is invalid", async () => {});
		it("correctly throws an error when the amount is invalid", async () => {});
		it("errors when account already exists", () => {});
	});

	describe("Migration Contract: Signing & Claiming", () => {
		it.concurrent("correctly claims with an eos signature", async () => {
			const { mint, ata } = await setup({ provider, payer });
		
			const eosPrivatekey = PrivateKey.from(
				"5K5UuCj9PmMSFTyiWzTtPF4VmUftVqScM3QJd9HorrZGCt4LgLu",
			);

			const eosPublicKey = eosPrivatekey.toPublic();
			const pk = extractEosPublicKeyBytes(eosPublicKey.toString());
			
			if (!pk) {
				throw new Error("Invalid public key");
			}

			const { tokenClaimAccount, tokenClaimVault } = await useCreateTokenClaim({
				mint,
				payer,
				payerTokens: ata,
				publicKey: pk,
				provider
			});

			const session = new Session({
				permissionLevel: {
					actor: "effectai",
					permission: "active",
				},
				chain: {
					id: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
					url: "https://eos.greymass.com",
				},
				walletPlugin: new WalletPluginPrivateKey(
					"5K5UuCj9PmMSFTyiWzTtPF4VmUftVqScM3QJd9HorrZGCt4LgLu",
				),
			});

			const abi = new ABICache(session.client);
			const eosAbi = await abi.getAbi("eosio.token");

			const action = Action.from(
				{
					account: "effecttokens",
					name: "issue",
					authorization: [
						{
							actor: "effectai",
							permission: "active",
						},
					],
					data: {
						to: "effectai",
						quantity: "0 EFX",
						memo: originalMessage,
					},
				},
				eosAbi,
			);

			// serialize the transaction
			const txHeader = TransactionHeader.from({
				expiration: 0,
				ref_block_num: 11,
				ref_block_prefix: 32,
				delay_sec: 0,
			});

			const tx = Transaction.from({
				actions: [action],
				...txHeader,
			});

			const serializedTransactionBytes = tx.signingData(
				"aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
			);

			const signature = await session.signTransaction(tx);

			await program.methods
				.claimTokens(
					Buffer.from(signature[0].data.array),
					Buffer.from(serializedTransactionBytes.array),
				)
				.accounts({
					claimAccount: tokenClaimAccount,
					recipientTokenAccount: ata,
					vaultAccount: tokenClaimVault,
					payer: payer.publicKey,
					mint,
				})
				.signers([payer])
				.rpc();
		});

		it.concurrent("correctly signs with keccak256", async () => {
			const { mint, ata } = await setup({ provider, payer });
			const { tokenClaimAccount, tokenClaimVault } = await useCreateTokenClaim({
				mint,
				payer,
				payerTokens: ata,
				publicKey: toBytes(ethPublicKey),
				provider
			});
			
			const ethPrivateKey =
				"d09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5";

			// keccak256 hash of the message
			const keccakHash = keccak256(Buffer.from(originalMessage));

			// sign the hash
			const sig = secp256k1.sign(keccakHash.slice(2), ethPrivateKey);

			// add the recovery byte to the signature
			const sigWithRecovery = Buffer.concat([
				sig.toCompactRawBytes(),
				Buffer.from([sig.recovery + 27]),
			]);

			await program.methods
				.claimTokens(sigWithRecovery, Buffer.from(originalMessage))
				.accounts({
					mint,
					payer: payer.publicKey,
					claimAccount: tokenClaimAccount,
					recipientTokenAccount: ata,
					vaultAccount: tokenClaimVault,
				})
				.signers([payer])
				.rpc();
		});

		it.concurrent("correctly claims with eth_personal_sign", async () => {
			const { mint, ata } = await setup({ provider, payer });
			const { tokenClaimAccount,tokenClaimVault } = await useCreateTokenClaim({
				mint,
				payer,
				payerTokens: ata,
				publicKey: toBytes(ethPublicKey),
				provider
			});

			const account = privateKeyToAccount(
				"0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
			);
			const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
			const message = prefix + originalMessage;

			const signature = await account.signMessage({
				message: originalMessage,
			});

			await program.methods
				.claimTokens(Buffer.from(toBytes(signature)), Buffer.from(message))
				.accounts({
					mint,
					payer: payer.publicKey,
					claimAccount: tokenClaimAccount,
					recipientTokenAccount: ata,
					vaultAccount: tokenClaimVault,
				})
				.rpc();
		});

		it.concurrent("can claim a stake with a valid signature", async () => {
			const { mint, ata } = await setup({ provider, payer });

			// get a date from 1 year ago
			const stakeStartTime = new Date().getTime() - 31556952000;
			
			const account = privateKeyToAccount(
				"0xd09351350882928165a6bd1cbbe232dd23371cafe68848d2146ba8e8874b27e5",
			);

			const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
			const message = prefix + originalMessage;

			const signature = await account.signMessage({
				message: originalMessage,
			});

			const { stakeClaimAccount, stakeClaimVault } = await useCreateStakeClaim({
				mint,
				payer,
				payerTokens: ata,
				publicKey: toBytes(ethPublicKey),
				stakeStartTime,
				provider
			});

			const {stakeAccount, vaultAccount} = useDeriveStakeAccounts({
				mint,
				authority: payer.publicKey,
				programId: stakeProgram.programId
			})

			await program.methods
				.claimStake(Buffer.from(toBytes(signature)), Buffer.from(message))
				.accounts({
					recipientTokenAccount: ata,
					vaultAccount: stakeClaimVault,
					payer: payer.publicKey,
					claimAccount: stakeClaimAccount,
					stakeAccount,
					stakeVaultAccount: vaultAccount,
					mint,
				})
				.rpc();

			// check if the stake account was created
			const stakeAccountData = await stakeProgram.account.stakeAccount.fetch(stakeAccount)
			expect(stakeAccountData).to.not.be.null;
			// check if the stake account has the correct start time (stake age)
			expect(stakeAccountData.timeStake.toNumber()).to.equal(stakeStartTime);

			// check if the stake vault account was created and has a balance
			const stakeVaultBalance = await provider.connection.getTokenAccountBalance(vaultAccount);
			expect(stakeVaultBalance.value.uiAmount).to.be.greaterThan(0);

			// check if claim vault is created and emptied out
			const claimVaultBalance = await provider.connection.getTokenAccountBalance(stakeClaimVault);
			expect(claimVaultBalance.value.uiAmount).to.equal(0);
		});

		it("correctly throws an error when the message is incorrect", async () => {});

		it("correctly throws an error when the signature is incorrect", async () => {});
	});
});
