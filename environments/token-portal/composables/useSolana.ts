import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstructionWithDerivation, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { useWallet } from "solana-wallets-vue"

export const useSolana = () => {
    const connection = new Connection('http://localhost:8899', 'confirmed')
    const { sendTransaction } = useWallet()

    const getOrCreateAssociatedTokenAccount = async (mint: PublicKey, owner: PublicKey) => {
        // check if ata exists
        const ata = getAssociatedTokenAddressSync(mint, owner);

        const accountInfo = await connection.getAccountInfo(ata);

        const transaction = new Transaction()

        if (accountInfo === null) {
            console.log('Creating ATA')
            const createAccountInstruction = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
                owner,
                owner,
                mint
            )

            transaction.add(createAccountInstruction)

            try {
                const sentTx = await sendTransaction(transaction, connection)
                await connection.confirmTransaction(sentTx, 'confirmed')
                return ata
            } catch (e) {
                console.error(e)
            }

        }else {
            console.log('ATA exists')
            return ata
        }

    }

    return { getOrCreateAssociatedTokenAccount }
}