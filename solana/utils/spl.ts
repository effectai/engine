import {
	Connection,
	Keypair,
	type PublicKey,
	SystemProgram,
	Transaction,
} from "@solana/web3.js";
import {
	TOKEN_PROGRAM_ID,
	MintLayout,
	createInitializeMintInstruction,
	getAssociatedTokenAddress,
	createAssociatedTokenAccountInstruction,
	createMintToInstruction,
} from "@solana/spl-token";
import type { Provider } from "@coral-xyz/anchor";

export const setup = async ({payer, provider, amount} : {
    payer: Keypair;
    provider: Provider;
	amount?: number;
}) => {
    const connection = new Connection('http://localhost:8899');
	// create spl token mint
	const mint = await createMint({
        connection,
        payer,
        decimals: 6,
        provider,
        mintAuthority: payer.publicKey,
    });

	// create associated token account
	const ata = await createTokenAccount({
        payer,
        mint,
        owner: payer.publicKey,
        provider,
    }
	);

	// mint some tokens to the associated token account
	await mintToAccount({
        payer,
        mint,
        destination: ata,
        provider,
        mintAuthority: payer,
        amount: amount || 100_000_000,
    });

	return {
		payer,
		mint,
		ata,
	};
};

/**
 * Creates a new SPL token mint for testing purposes.
 * @param connection - Solana connection object
 * @param payer - Keypair of the account paying for transactions and creating the mint
 * @param mintAuthority - The mint authority for the new token
 * @param decimals - Number of decimals for the token
 * @returns The public key of the newly created mint
 */
export async function createMint({
	connection,
	payer,
	mintAuthority,
	decimals,
	provider,
}: {
	connection: Connection;
	payer: Keypair;
	mintAuthority: PublicKey;
	decimals: number;
	provider: Provider;
}): Promise<PublicKey> {
	const mint = Keypair.generate();
	const lamports = await connection.getMinimumBalanceForRentExemption(
		MintLayout.span,
	);

	const transaction = new Transaction().add(
		SystemProgram.createAccount({
			fromPubkey: payer.publicKey,
			newAccountPubkey: mint.publicKey,
			space: MintLayout.span,
			lamports,
			programId: TOKEN_PROGRAM_ID,
		}),
		createInitializeMintInstruction(
			mint.publicKey,
			decimals,
			mintAuthority,
			null,
			TOKEN_PROGRAM_ID,
		),
	);

	if (!provider.sendAndConfirm) {
		throw new Error("sendAndConfirm not implemented");
	}

	await provider.sendAndConfirm(transaction, [payer, mint]);

	return mint.publicKey;
}

/**
 * Creates an associated token account for the given mint and owner.
 * @param connection - Solana connection object
 * @param payer - Keypair of the account paying for the transaction
 * @param mint - The mint public key of the SPL token
 * @param owner - The owner of the associated token account
 * @returns The public key of the associated token account
 */
export async function createTokenAccount({
	payer,
	mint,
	owner,
	provider,
}: {
	payer: Keypair;
	mint: PublicKey;
	owner: PublicKey;
	provider: Provider;
}): Promise<PublicKey> {
	const tokenAccount = await getAssociatedTokenAddress(mint, owner);

	const transaction = new Transaction().add(
		createAssociatedTokenAccountInstruction(
			payer.publicKey,
			tokenAccount,
			owner,
			mint,
		),
	);

	if (!provider.sendAndConfirm) {
		throw new Error("sendAndConfirm not implemented");
	}

	await provider.sendAndConfirm(transaction, [payer]);

	return tokenAccount;
}

/**
 * Mints tokens to a specified token account.
 * @param connection - Solana connection object
 * @param payer - Keypair of the account paying for the transaction
 * @param mint - The mint public key of the SPL token
 * @param destination - The token account to receive the minted tokens
 * @param mintAuthority - The mint authority for the token
 * @param amount - The amount of tokens to mint (in smallest units based on mint decimals)
 */
export async function mintToAccount({
	payer,
	mint,
	destination,
	mintAuthority,
	amount,
    provider,
}: {
	payer: Keypair;
	mint: PublicKey;
	destination: PublicKey;
	mintAuthority: Keypair;
	amount: number;
    provider: Provider;
}): Promise<void> {
	const transaction = new Transaction().add(
		createMintToInstruction(
			mint,
			destination,
			mintAuthority.publicKey,
			amount,
			[],
			TOKEN_PROGRAM_ID,
		),
	);

    if(!provider.sendAndConfirm){
        throw new Error('sendAndConfirm not implemented')
    }

	await provider.sendAndConfirm(transaction, [
		payer,
		mintAuthority,
	]);
}
