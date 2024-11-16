import { createAssociatedTokenAccountIdempotentInstructionWithDerivation, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token"
import { Connection, PublicKey, Transaction, type ParsedAccountData } from "@solana/web3.js"
import { useMutation, useQuery } from "@tanstack/vue-query"
import { useWallet } from "solana-wallets-vue"
import { toBytes } from "viem"

export const useSolana = () => {
    const connection = new Connection('http://localhost:8899', 'confirmed')
    const config = useRuntimeConfig();

    const { sendTransaction } = useWallet()

    const useClaim = () => {

        const { mutateAsync: claim } = useMutation({
            mutationFn: async ({
                signature,
                message,
                metadata,
                isEth
            }: {
                signature: Buffer
                ,
                message: Buffer,
                metadata: PublicKey,
                isEth: boolean
            }) => {

                const { program } = useAnchorWorkspace()
                const { publicKey } = useWallet()

                if (!publicKey.value) {
                    throw new Error('No public key')
                }

                const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT)
                const ata = getAssociatedTokenAddressSync(mint, publicKey.value)

                if (!ata) {
                    throw new Error("Could not create associated token account")
                }

                const [vault, bump] = await PublicKey.findProgramAddress(
                    [metadata.toBuffer()],
                    program.programId
                )

                await program.methods.claim(
                    signature,
                    message,
                    isEth,
                ).accounts({
                    payer: publicKey.value,
                    metadataAccount: metadata,
                    vaultAccount: vault,
                    recipientTokens: ata
                }).rpc()
            }
        })

        return { claim }
    }

    const useEffectTokenAccount = () => {
        const { EFFECT_SPL_TOKEN_MINT } = config.public
        const { publicKey } = useWallet()

        const { mutateAsync: createAccount } = useMutation({
            mutationFn: async () => {
                if (!publicKey.value) {
                    throw new Error('No public key')
                }

                const ata = getAssociatedTokenAddressSync(new PublicKey(EFFECT_SPL_TOKEN_MINT), publicKey.value)
                const createAccountInstruction = createAssociatedTokenAccountInstruction(
                    ata,
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


        const result = useQuery({
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

        const data = computed(() => result.data?.value?.value?.data as ParsedAccountData)
        const balance = computed(() => data.value?.parsed?.info?.tokenAmount?.uiAmount)

        return {
            account: data,
            balance,
            createAccount
        }
    }

    return { useEffectTokenAccount, useClaim }
}