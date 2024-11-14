import { type Connection, Keypair, type PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, MintLayout, createInitializeMintInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } from '@solana/spl-token';

export const setup = async (payer: Keypair, connection: Connection) => {
    // create a wallet 
    // airdrop some SOL to the wallet
    const tx = await connection.requestAirdrop(payer.publicKey, 1000000000);
   
    await connection.confirmTransaction(
        tx,
        'confirmed',
    );

    // create spl token mint
    const mint = await createMint(connection, payer, payer.publicKey, 2);

    console.log('mint', mint.toBase58())

     // create associated token account
    const ata = await createTokenAccount(connection, payer, mint, payer.publicKey);

    console.log('ata', ata.toBase58())

     // mint some tokens to the associated token account
    await mintToAccount(connection, payer, mint, ata, payer, 1000);

    return {
        payer,
        mint,
        ata
    }
}

/**
 * Creates a new SPL token mint for testing purposes.
 * @param connection - Solana connection object
 * @param payer - Keypair of the account paying for transactions and creating the mint
 * @param mintAuthority - The mint authority for the new token
 * @param decimals - Number of decimals for the token
 * @returns The public key of the newly created mint
 */
export async function createMint(
    connection: Connection,
    payer: Keypair,
    mintAuthority: PublicKey,
    decimals: number
): Promise<PublicKey> {
    const mint = Keypair.generate();
    const lamports = await connection.getMinimumBalanceForRentExemption(MintLayout.span);

    const transaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint.publicKey,
            space: MintLayout.span,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMintInstruction(mint.publicKey, decimals, mintAuthority, null, TOKEN_PROGRAM_ID)
    );

    const tx = await connection.sendTransaction(transaction, [payer, mint]);

    // confirm tx
    await connection.confirmTransaction(tx, 'confirmed');

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
export async function createTokenAccount(
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    owner: PublicKey
): Promise<PublicKey> {
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);

    const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(payer.publicKey, tokenAccount, owner, mint)
    );

    const tx = await connection.sendTransaction(transaction, [payer]);
    await connection.confirmTransaction(tx, 'confirmed');
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
export async function mintToAccount(
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    mintAuthority: Keypair,
    amount: number
): Promise<void> {
    const transaction = new Transaction().add(
        createMintToInstruction(mint, destination, mintAuthority.publicKey, amount, [], TOKEN_PROGRAM_ID)
    );

    const tx = await connection.sendTransaction(transaction, [payer, mintAuthority]);
    // wait for tx to confirm
    await connection.confirmTransaction(tx, 'confirmed');
}