<template>
    <div>
        <div v-if="!isConnected" class="gap-5 flex justify-left mt-6 items-center">
            <UButton @click="connectEos()" color="black" variant="outline">
                <span class="w-3 ">
                    <svg class="dark:fill-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33.2 50"><title>Asset 1</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path d="M16.6,0,4.9,16.1,0,39.9,16.6,50,33.2,39.9,28.2,16ZM2.7,38.8,6.4,20.7l8.4,25.5ZM7.6,16.6l9-12.4,9,12.4-9,27.2ZM18.3,46.2l8.4-25.5,3.7,18.1Z"/></g></g></svg>
                </span>
                EOS Account
            </UButton>
            <ConnectBscModal />
        </div>
    </div>
</template>

<script setup lang="ts">
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