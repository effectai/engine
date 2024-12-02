<template>
    <UCard class="text-center">
        <h2 class="title">Verify Ownership</h2>
        <UDivider class="my-3"/>
        <p class="text-lg mt-8 mb-12">
            To claim your new EFFECT tokens on Solana, you’ll need to verify ownership of your BSC or EOS account that
            held or staked EFX tokens on {{ snapshotDate.toLocaleString() }}.
            You can repeat this process for every account you own with EFX holdings.
        </p>

        <div v-if="!isConnected" class="gap-5 flex justify-center mt-6 items-center">
            <UButton @click="connectEos()" color="black" variant="outline">
                <span class="w-3">
                    <img src="@/assets/img/eos-logo.svg" alt="EOS" />
                </span>
                EOS Account
            </UButton>
            <ConnectBscModal />
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
    </UCard>
</template>

<script setup lang="ts">
import { useDisconnect } from "@wagmi/vue";
const { clear, set } = useGlobalState();

const config = useRuntimeConfig();
const snapshotDate = new Date(config.public.EFFECT_SNAPSHOT_DATE as string);

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
        const { signature, foreignPublicKey, message } = await authorizeEos();
        set(signature, message, foreignPublicKey, connectedAddress.value as string);
    } else {
        const { signature, foreignPublicKey, message } = await authorizeBsc();
        set(signature, message, foreignPublicKey, connectedAddress.value as string);
    }

    router.push("/migrate/step/claim");
}

watchEffect(() => {
    if (isConnected.value) {
        isOpenBscWalletModal.value = false;
    }
});


</script>

<style scoped></style>