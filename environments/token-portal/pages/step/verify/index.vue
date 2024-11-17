<template>
    <div class="text-center">
        <ConnectBscModal v-model="isOpen" />

        <h2 class="title">Verify Ownership</h2>
        <p class="text-lg mt-5">
            To claim your tokens on Solana, you must <u>verify ownership</u> of your BSC or EOS account holding EFX
            tokens. You can repeat this process for each account you own.
        </p>

        <div v-if="!isConnected" class="gap-5 flex justify-center mt-6 items-center">
            <UButton @click="connectEos()"
                class="bg-white text-black border-black border-2 font-semibold py-2 px-4 rounded-md shadow-md transition-all">
                <span class="w-3">
                    <img src="@/assets/img/eos-logo.svg" alt="EOS" />
                </span>
                EOS Account
            </UButton>
            <UButton @click="isOpen = true"
                class="bg-black text-white font-semibold border-2 border-black py-2 px-4 rounded-md shadow-md transition-all">
                <span class="w-4">
                    <img src="@/assets/img/bsc.svg" alt="bsc" />
                </span>
                BSC Account
            </UButton>
        </div>
        <div v-else-if="canClaim">
            <p>Verification successful</p>
        </div>
        <div v-else-if="isConnectedEos">
            <div class="mt-5">
                <p>Connected to EOS Account: {{ actor }}</p>
                <div class="gap-3 flex mt-5 justify-center items-center">
                    <UButton @click="disconnect()" color="black">Disconnect</UButton>
                    <UButton @click="authorizeEos" color="black">Verify</UButton>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAccount, useDisconnect, useSignMessage } from "@wagmi/vue";
import { useWallet } from "solana-wallets-vue";

const { publicKey } = useWallet();
const { canClaim } = useClaim();
const { address, connector } = useAccount();
const {
	connect: connectEos,
    disconnect: disconnectEos,
	actor,
	authorizeTokenClaim: _authorizeEos,
} = useEos();
const isOpen = ref(false);

const isConnectedEos = computed(() => actor.value);
const isConnectedBsc = computed(() => address.value);

const { set, clear } = useClaim();

// check if we're connected to BSC or EOS
const isConnected = computed(
	() => isConnectedEos.value || isConnectedBsc.value,
);

const router = useRouter();
const authorizeEos = async () => {
	if (!publicKey.value) {
		throw new Error("No public key");
	}

	const {
		publicKey: pk,
		signature,
		message,
	} = await _authorizeEos(publicKey.value);

    // set the signature and message to the claim state
	set(signature, message, pk);
    router.push('/step/claim')
};

const disconnect = () => {
    clear();
    disconnectEos();
}

onMounted(() => {
    if(!publicKey.value) {
        router.push('/step/connect')
    }
});


</script>

<style scoped></style>