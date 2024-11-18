<template>
    <div v-if="!session">
        Hello, World!
        <UButton @click="connectEos">Connect</UButton>
    </div>
    <div v-else>
        Hello, {{ actor }}!
        <UButton @click="logout">Logout</UButton>
        <UButton @click="signMessage">Sign</UButton>
    </div>

</template>

<script setup lang="ts">
import { useWallet } from "solana-wallets-vue";
import { ABICache, Action, PlaceholderAuth, Transaction, TransactionHeader, type Session } from '@wharfkit/session';
import { compressEosPubkey } from '../../../solana/utils/keys';

const { sessionKit } = useSessionKit()
const { publicKey: payer, connect } = useWallet();

const session: Ref<Session | null> = shallowRef(null)
const actor = computed(() => session.value?.actor)
    
export type CallbackType = string | { url: string; background: boolean }

onMounted(() => {
    sessionKit.restore().then((restoreSession) => {
        if (restoreSession) {
            session.value = restoreSession
        }
    });
})


const connectEos = async () => {
    const result =  await sessionKit.login();

    if (result) {
        session.value = result.session
    }
}

const router = useRouter()
const logout = () => {
    sessionKit.logout()
    session.value = null
    router.push('/')
}

</script>

<style lang="scss" scoped></style>