import { createAssociatedTokenAccountIdempotentInstructionWithDerivation, getAssociatedTokenAddressSync } from "@solana/spl-token"
import { Connection, PublicKey, Transaction, type ParsedAccountData } from "@solana/web3.js"
import { useMutation, useQuery } from "@tanstack/vue-query"
import { useWallet } from "solana-wallets-vue"

const connection = new Connection('http://localhost:8899', 'confirmed');

export const useSolana = () => {
    const config = useRuntimeConfig();

    const { sendTransaction } = useWallet()

    const useEffectTokenAccount = () => {
        const { EFFECT_SPL_TOKEN_MINT } = config.public
        const { publicKey } = useWallet()

        const { mutateAsync: createAccount } = useMutation({
            mutationFn: async () => {
                if (!publicKey.value) {
                    throw new Error('No public key')
                }

                const ata = getAssociatedTokenAddressSync(new PublicKey(EFFECT_SPL_TOKEN_MINT), publicKey.value)
                const createAccountInstruction = createAssociatedTokenAccountIdempotentInstructionWithDerivation(
                    publicKey.value,
                    publicKey.value,
                    new PublicKey(EFFECT_SPL_TOKEN_MINT)
                )

                const transaction = new Transaction()
                
                transaction.add(createAccountInstruction)
                transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash

                try {
                    const sentTx = await sendTransaction(transaction, connection)
                    await connection.confirmTransaction(sentTx, 'confirmed')
                    return ata
                } catch (e) {
                    console.error(e)
                }
            }
        })

        const getAssociatedTokenAccountQuery = useQuery({
            queryKey: [EFFECT_SPL_TOKEN_MINT, publicKey],
            enabled: computed(() => publicKey.value !== null),
            queryFn: async () => {

                if (!publicKey.value) {
                    throw new Error('No public key')
                }

                const ata = getAssociatedTokenAddressSync(new PublicKey(EFFECT_SPL_TOKEN_MINT), publicKey.value)
                return await connection.getParsedAccountInfo(ata)
            }
        })

        const data = computed(() => getAssociatedTokenAccountQuery.data?.value?.value?.data as ParsedAccountData)
        const balance = computed(() => data.value?.parsed?.info?.tokenAmount?.uiAmount)

        return {
            account: data,
            balance,
            createAccount
        }
    }

    return { useEffectTokenAccount, useClaim, connection }
}