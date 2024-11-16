<template>
    <div v-if="!session">
        Hello, World!
        <UButton @click="connect">Connect</UButton>
    </div>
    <div v-else>
        Hello, {{ session.actor }}!
        <UButton @click="sessionKit.logout">Logout</UButton>
        <UButton @click="signMessage">Sign</UButton>
    </div>
</template>

<script setup lang="ts">
import { ABICache, APIClient, Action, TransactContext, type Session } from '@wharfkit/session';
import { PlaceholderAuth, SigningRequest } from "@wharfkit/signing-request"
import Link from 'anchor-link';
import Transport from 'anchor-link-browser-transport'

const { sessionKit } = useSessionKit()
const session: Ref<Session | null> = shallowRef(null)
export type CallbackType = string | { url: string; background: boolean }

const signMessage = async () => {
    if (!session.value) {
        return
    }

    const link = new Link({
        transport: new Transport(),
        chains: [
            {
                nodeUrl: 'https://eos.greymass.com',
                chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
            },
        ],
    })

    const abi = new ABICache(session.value.client);
    const eosAbi = await abi.getAbi('eosio.token')

    const action = Action.from({
        account: 'effecttokens',
        name: 'issue',
        authorization: [PlaceholderAuth],
        data: {
            to: 'effectai',
            quantity: '0 EFX',
            memo: 'hello',
        }
    }, eosAbi)

    const result = await link.transact({action}, {broadcast: false})
    console.log('message signed', result.transaction.signingDigest(result.chain.chainId))
    const message = result.transaction.signingDigest(result.chain.chainId);
    
    const signature = result.signatures[0].recoverMessage(message.array)
    console.log(signature)

}

sessionKit.restore().then((restoreSession) => {
    if (restoreSession) {
        session.value = restoreSession
    }
});

const connect = async () => {
    const result = await sessionKit.login();
    if (result) {
        session.value = result.session;
    }
}


</script>

<style lang="scss" scoped></style>