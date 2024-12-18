<template>
    <div>
        <div v-if="!isConnected" class="gap-5 flex justify-center mt-6 items-center">
            <UButton @click="connectEos()" color="black" variant="outline">
                <span class="w-3">
                    <img src="@/assets/img/eos-logo.svg" alt="EOS" />
                </span>
                EOS Account
            </UButton>
            <ConnectBscModal />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useDisconnect } from "@wagmi/vue";

export type Authorize = {
    signature: Uint8Array;
    foreignPublicKey: Uint8Array;
    message: Uint8Array;
    connectedAddress: string;
}

const {
    isConnected: isConnectedEos,
    connect: connectEos,
    disconnect: disconnectEos,
    authorizeTokenClaim: _authorizeEos,
} = useEosWallet();

const {
    isConnected: isConnectedBsc,
} = useBscWallet();


const emit = defineEmits<(e: 'connect') => void>();

// check if we're connected to BSC or EOS
const isConnected = computed(() => isConnectedEos.value || isConnectedBsc.value);

const isOpenBscWalletModal = ref(false);

watchEffect(() => {
    if (isConnected.value) {
        isOpenBscWalletModal.value = false;
    }
});

watchEffect(() => {
    if (isConnectedEos.value) {
        emit('connect');
    } else if (isConnectedBsc.value) {
        emit('connect');
    }
});


</script>

<style lang="scss" scoped></style>