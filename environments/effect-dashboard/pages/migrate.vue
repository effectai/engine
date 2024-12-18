<template>
    <div class="text-center max-w-sm md:max-w-md lg:max-w-lg mx-auto scroll-container" v-if="config">
        <Stepper :currentStep="currentStep" :items="steps">
            <template #authenticate="{ isCompleted }">
                <div>
                    <div v-if="isCompleted">
                        <div class="flex-col flex items-center justify-center gap-3 mt-5" v-if="walletMeta">
                            <span class="text-sm text-gray-600 dark:text-gray-400  capitalize">
                                <span v-if="walletMeta.icon">
                                    <img :src="walletMeta.icon" class="h-5 w-5 inline-block mr-1" />
                                </span>
                                {{ walletMeta.name }}
                            </span>
                            <div class="flex items-center justify-between" v-if="address">
                                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Address:</span>
                                <BlockchainAddress class="text-sm" :address="address" />
                            </div>
                        </div>
                        <UButton class="mt-5" @click="disconnectSourceWallets" color="black" variant="outline">
                            Disconnect</UButton>
                    </div>
                    <div v-else>
                        <div class="my-5">
                            To claim your new EFFECT tokens on Solana, you’ll need to <u>verify ownership</u> of a
                            <b>BSC</b> or
                            <b>EOS</b> account
                            that held or staked EFX tokens on <u>{{ snapshotDate.toLocaleString() }}</u>.
                            You can repeat this process for every account you own that held or staked EFX tokens.
                        </div>
                        <ConnectSourceWalletForm />
                    </div>
                </div>
            </template>
            <template #solana>
                <div>
                    <!-- step 2 show claim / select / connect solana wallet  -->
                    <p>Next, we'll need your solana address, this is the address you will receive your new EFFECT tokens
                        on.</p>

                    <div v-if="!destinationAddress">
                        <div class="flex flex-wrap justify-center items-center gap-2 my-8">
                            <span class="flex gap-2 items-center" v-if="$device.isDesktop">
                                <WalletMultiButton /> or
                            </span> <a href="#" class="text-sm text-red-500"
                                @click="toggleAddress = !toggleAddress">Manually enter your address</a>
                        </div>
                        <div class="flex w-full" v-show="toggleAddress">
                            <UInput placeholder="Your solana address" v-model="manualAddressInput" type="text"
                                class="border border-gray-300 rounded-md p-2 flex-grow" />
                            <UButton color="black" @click="selectAddress" label="Select" />
                        </div>
                    </div>

                    <div v-else class="flex justify-between mt-5 items-center gap-1">
                        <b>Chosen address:</b>
                        <BlockchainAddress :address="destinationAddress" /> | <a href="#" @click="logout">Change</a>
                    </div>
                </div>
            </template>
            <template #authorize="{ isCompleted }">
                <div>
                    <div v-if="isCompleted">
                        <p>Successfully authenticated and authorized.</p>
                    </div>
                    <div v-else>
                        <!-- step 3: show authorize button -->
                        <p>Authorize the migration of your EFX tokens to the Solana network.</p>
                        <UButton @click="authorize" class="mt-5" color="black" variant="outline">Authorize</UButton>
                    </div>
                </div>
            </template>
            <template #claim>
                <div>
                    <div v-if="!migrationAccount">
                        <p>No Active claims found for this account.</p>
                    </div>
                    <div v-else-if="$device.isMobileOrTablet">
                        It seems you've successfully authenticated and authorized using a mobile wallet. To claim your
                        tokens, please open the link below on a desktop device:
                        <a :href="authorizeUrl">Authorize</a>
                    </div>
                    <div v-else class="text-center flex justify-center my-5">
                        <div v-if="!solanaWalletAddress">
                            <WalletMultiButton />
                        </div>
                        <div v-else>
                            <div id="confetti-container" class="max-w-[50px] mx-auto w-full h-1">
                                <ConfettiExplosion v-if="txHash" :particleCount="200" :force="0.3" />
                            </div>

                            <p>Claim your new EFFECT tokens on Solana.</p>
                            <ClaimCard v-if="migrationAccount" :migrationAccount="migrationAccount" />
                            <UButton @click="claimHandler" class="mt-5" color="black" variant="outline">Claim</UButton>
                        </div>
                    </div>
                </div>
            </template>
        </Stepper>
    </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { WalletMultiButton, useWallet } from 'solana-wallets-vue';
import ConfettiExplosion from "vue-confetti-explosion";

const message: Ref<Uint8Array | null> = ref(null)
const signature: Ref<Uint8Array | null> = ref(null)
const manualForeignPublicKey: Ref<Uint8Array | null> = ref(null)

const computedForeignPublicKey: Ref<Uint8Array | null | undefined> = computed(() => manualForeignPublicKey.value || foreignPublicKey.value)

// try to load state from url
onMounted(() => {
    const url = new URL(window.location.href)
    const messageFromUrl = url.searchParams.get('message')
    const signatureFromUrl = url.searchParams.get('signature')
    const foreignPublicKeyFromUrl = url.searchParams.get('foreignPublicKey')
    // extract destinationAdress from message
    if (messageFromUrl && signatureFromUrl && foreignPublicKeyFromUrl) {
        message.value = new Uint8Array(atob(messageFromUrl).split('').map(c => c.charCodeAt(0)))
        // extract the destination address from the message
        manualAddress.value = extractAuthorizedSolanaAddress(new TextDecoder().decode(message.value))
        signature.value = new Uint8Array(atob(signatureFromUrl).split('').map(c => c.charCodeAt(0)))
        manualForeignPublicKey.value = new Uint8Array(atob(foreignPublicKeyFromUrl).split('').map(c => c.charCodeAt(0)))
    }
})

const config = useRuntimeConfig();
const snapshotDate = new Date(config.public.EFFECT_SNAPSHOT_DATE as string);

const { walletMeta, useGetForeignPublicKeyQuery, disconnect, authorizeTokenClaim, address } = useSourceWallet();
const { data: foreignPublicKey } = useGetForeignPublicKeyQuery()

const client = useQueryClient()
const disconnectSourceWallets = async () => {
    disconnect()
    client.resetQueries({ queryKey: ['foreign-public-key'] })
    logout()
}

const toggleAddress = ref(false)
const manualAddress: Ref<string | null> = ref(null)
const manualAddressInput: Ref<string> = ref('')
const { address: solanaWalletAddress } = useSolanaWallet()
const destinationAddress = computed(() => {
    return solanaWalletAddress.value || manualAddress.value
})
const { disconnect: disconnectSolana } = useWallet()
const logout = () => {
    message.value = null
    signature.value = null
    manualForeignPublicKey.value = null
    manualAddress.value = null
    disconnectSolana()
}
const selectAddress = () => {
    if (isValidSolanaAddress(manualAddressInput.value)) {
        manualAddress.value = manualAddressInput.value
        toggleAddress.value = false
    } else {

    }
}

const { useGetMigrationAccount, useClaim } = useMigrationProgram();
const { data: migrationAccount } = useGetMigrationAccount(computedForeignPublicKey)

const txHash: Ref<string | null> = ref(null)

function uint8ArrayToBase64(uint8Array: Uint8Array) {
    return btoa(String.fromCharCode(...uint8Array))
}

const authorizeUrl = computed(() => {
    if (!message.value || !signature.value || !computedForeignPublicKey.value) {
        return ''
    }

    return getAuthorizeUrl({
        message: message.value,
        signature: signature.value,
        foreignPublicKey: computedForeignPublicKey.value,
    })
})

const getAuthorizeUrl = ({
    message,
    signature,
    foreignPublicKey,
}: {
    message: Uint8Array, signature: Uint8Array, foreignPublicKey: Uint8Array
}) => {
    const url = new URL(window.location.href)

    url.searchParams.set('message', uint8ArrayToBase64(message))
    url.searchParams.set('signature', uint8ArrayToBase64(signature))
    url.searchParams.set('foreignPublicKey', uint8ArrayToBase64(foreignPublicKey))

    return url.toString()
}

const authorize = async () => {
    const result = await authorizeTokenClaim(destinationAddress.value)
    if (result) {
        message.value = result.message
        signature.value = result.signature
    }
}

const toast = useToast()
const { mutateAsync: claimTokens } = useClaim()
const claimHandler = async () => {
    if (!signature.value || !computedForeignPublicKey.value || !message.value) {
        console.warn('missing signature, foreignPublicKey or message')
        return
    }

    try {
        const transactionId = await claimTokens({ signature: signature.value, foreignPublicKey: computedForeignPublicKey.value, message: message.value })
        txHash.value = transactionId;
        toast.add({ title: 'Success', description: 'Claimed tokens successfully', color: 'green' })
    } catch (e) {
        console.log(e)
        toast.add({ title: 'Error', description: "Something went wrong", color: 'red' })
    }
}
const steps = ref([
    {
        label: 'Authenticate',
        slot: 'authenticate',
        isCompleted: computed(() => !!computedForeignPublicKey.value),
    },
    {
        label: 'Solana Address',
        slot: 'solana',
        isCompleted: computed(() => !!destinationAddress.value),
    },
    {
        label: 'Authorize',
        slot: 'authorize',
        isCompleted: computed(() => !!signature.value && !!message.value),
    },
    {
        label: 'Claim',
        slot: 'claim',
        isCompleted: computed(() => !!txHash.value),
    },
])

const isReadyToClaim = computed(() => message.value && signature.value && computedForeignPublicKey.value)
const currentStep = computed(() => {
    if (isReadyToClaim.value) {
        return 3
    }

    if (!foreignPublicKey.value) {
        return 0
    } if (!destinationAddress.value) {
        return 1
    } if (!signature.value || !message.value) {
        return 2
    }
})


</script>

<style lang="scss" scoped>

</style>