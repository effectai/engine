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
                    Sign & Claim
                </UButton>
            </div>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { PublicKey, Transaction } from "@solana/web3.js";
import { useAccount, useDisconnect, useSignMessage } from "@wagmi/vue";
import { toBytes } from "viem";

definePageMeta({
	middleware: "auth",
});

const { isConnected } = useAccount();
const { address, connector } = useAccount();
const { disconnect } = useDisconnect();
const { signMessageAsync } = useSignMessage();

const signature = ref<string | null>(null);
const metadata = new PublicKey("9FGhFTBgmdYyRsjrMGgsW6X2RYw5whhx4dhFLRR5WJHi");

const { useClaim } = useSolana();
const { claim } = useClaim();

const _signMessage = async () => {
	const originalMessage =
		"Effect.AI: Sign this message to prove ownership of your address.";
	const prefix = `\x19Ethereum Signed Message:\n${originalMessage.length}`;
	const message = Buffer.from(prefix + originalMessage);
	signature.value = await signMessageAsync({ message: originalMessage });

	await claim({
		signature: Buffer.from(toBytes(signature.value)),
		message: message,
		isEth: true,
        metadata,
	});
};
</script>

<style lang="scss" scoped></style>