<template>
    <div class="text-center">
        <ConnectBscModal v-model="isOpenBscWalletModal" />

        <h2 class="title">Verify Ownership</h2>
        <p class="text-lg my-5">
            To claim your tokens on Solana, you must <u>verify ownership</u> of your BSC or EOS account holding EFX
            tokens. You can repeat this process for each account you own.
        </p>

        <div v-if="!isConnected" class="gap-5 flex justify-center mt-6 items-center">
            <UButton @click="connectEos()" color="black" variant="outline">
                <span class="w-3">
                    <img src="@/assets/img/eos-logo.svg" alt="EOS" />
                </span>
                EOS Account
            </UButton>
            <UButton @click="isOpenBscWalletModal = true" color="black">
                <span class="w-4">
                    <img src="@/assets/img/bsc.svg" alt="bsc" />
                </span>
                BSC Account
            </UButton>
        </div>
        <div v-else-if="isConnected">
            <WalletCard v-if="connectedAddress && connectedWalletMeta" :chain="chain" :walletMeta="connectedWalletMeta"
                :address="connectedAddress" :balanceQuery="balanceQuery" :efxBalanceQuery="efxBalanceQuery"
                @disconnect="disconnect">
                <template #action>
                    <div class="flex justify-center text-center items-center w-full mt-5">
                        <UButton @click="authorize" color="black">
                            Verify Ownership
                        </UButton>
                    </div>
                </template>
            </WalletCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAccount, useDisconnect, useSignMessage } from "@wagmi/vue";

const { clear, canClaim, set } = useGlobalState();

const {
    isConnected: isConnectedEos,
    connect: connectEos,
    disconnect: disconnectEos,
    address: eosAddress,
    authorizeTokenClaim: _authorizeEos,
    walletMeta: eosWalletMeta,
    useGetBalanceQuery: eosBalanceQuery,
    useGetEfxBalanceQuery: eosEfxBalanceQuery,
    authorizeTokenClaim: authorizeEos,
} = useEosWallet();

const {
    address: bscAddress,
    walletMeta: bscWalletMeta,
    isConnected: isConnectedBsc,
    useGetBalanceQuery: bscBalanceQuery,
    useGetEfxBalanceQuery: bscEfxBalanceQuery,
    authorizeTokenClaim: authorizeBsc,
} = useBscWallet();

// check if we're connected to BSC or EOS
const isConnected = computed(() => isConnectedEos.value || isConnectedBsc.value);
const connectedWalletMeta = computed(() => isConnectedEos.value ? eosWalletMeta.value : bscWalletMeta.value);
const chain = computed(() => isConnectedEos.value ? 'EOS' : 'BSC');
const connectedAddress = computed(() => isConnectedEos.value ? eosAddress.value : bscAddress.value);
const balanceQuery = computed(() => isConnectedEos.value ? eosBalanceQuery : bscBalanceQuery);
const efxBalanceQuery = computed(() => isConnectedEos.value ? eosEfxBalanceQuery : bscEfxBalanceQuery);

const { disconnect: disconnectBsc } = useDisconnect()

const disconnect = () => {
    clear();
    disconnectEos();
    disconnectBsc();
}

const isOpenBscWalletModal = ref(false);

const router = useRouter();
const authorize = async () => {
    if (isConnectedEos.value) {
        const {signature, foreignPublicKey, message} = await authorizeEos();
        console.log(signature, foreignPublicKey, message);
        set( signature, message, foreignPublicKey);
    } else {
        const {signature, foreignPublicKey, message} = await authorizeBsc();
        set( signature, message, foreignPublicKey);
    }

    router.push("/step/claim");
}

watchEffect(() => {
    if (isConnected.value) {
        isOpenBscWalletModal.value = false; 
    }
});


</script>

<style scoped></style>