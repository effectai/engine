<template>
    <UContainer>
        <div v-if="!isConnected">
            <h1 class="mt-5 title">Please connect your BSC wallet.</h1>
            <ConnectBsc />
        </div>
        <div v-else>
            <div>Address: {{ address }}</div>
            <div>Connected to {{ connector?.name }} Connector.</div>
            <div class="gap-3 flex">
                <UButton @click="disconnect()">Disconnect</UButton>
                <UButton @click="_signMessage">
                    Sign message
                </UButton>
            </div>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { useAccount, useDisconnect, useSignMessage } from "@wagmi/vue";
import { sha256, toBytes } from "viem";
import { useWallet } from "solana-wallets-vue";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { useAnchorWorkspace } from "~/composables/useWorkspace";

definePageMeta({
	middleware: "auth",
});

const { isConnected } = useAccount();
const { wallet, publicKey, signTransaction, sendTransaction } = useWallet();
const { address, connector } = useAccount();
const { disconnect } = useDisconnect();
const { signMessageAsync } = useSignMessage();
const { program } = useAnchorWorkspace()
const { getOrCreateAssociatedTokenAccount} = useSolana()

const signature = ref<string | null>(null);
const metadata = new PublicKey("4zJyfhHc3EUBv5xzuvPgTHxNrLVViSXysa55sgghbEkj")
const config = useRuntimeConfig();

const _signMessage = async () => {
    const connection = new Connection('http://localhost:8899', 'confirmed')

	const originalMessage =
		"Effect.AI: Sign this message to prove ownership of your address.";

    const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;

    const message = Buffer.from(prefix + originalMessage);

	signature.value = await signMessageAsync({ message:originalMessage });

    console.log("Signature:", signature.value);

    if(!publicKey.value){
        return
    }

    const mint = new PublicKey(config.public.EFFECT_SPL_TOKEN_MINT)
    
    const ata = await getOrCreateAssociatedTokenAccount(mint, publicKey.value)

    if(!ata){
        throw new Error("Could not create associated token account")
    }

    const [vault, bump] = await PublicKey.findProgramAddress(
        [metadata.toBuffer()],
        program.programId
    )

    const tx = await program.methods.claim(
        Buffer.from(toBytes(signature.value)),
        message,
        true
    ).accounts({
        payer: publicKey.value,
        metadataAccount: metadata,
        vaultAccount: vault,
        recipientTokens: ata
    }).rpc()

    console.log("Transaction:", tx)
}

</script>

<style lang="scss" scoped></style>