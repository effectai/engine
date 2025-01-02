<template>
    <div class="text-center max-w-sm md:max-w-md lg:max-w-lg mx-auto scroll-container" v-if="config">
        <Stepper v-if="currentStep !== undefined" :currentStep="currentStep" :items="steps">
            <template #authenticate="{ isCompleted }">
                <div>
                    <div v-if="isCompleted">
                        <div class="flex-col flex items-center justify-center gap-3 mt-5" v-if="walletMeta">
                            <WalletCard 
                                v-if="address && walletMeta"
                                :address="address" 
                                :balance-query="useGetNativeBalanceQuery" 
                                :efx-balance-query="useGetEfxBalanceQuery" 
                                :walletMeta="walletMeta" 
                                :onDisconnect="disconnectSourceWallets"
                                />
                        </div>
                        <div class="text-red-500" v-if="walletMeta?.permission && walletMeta.hasDifferentPermissions">
                            Warning: Your wallet is connected through the {{ walletMeta.permission }} permission. Please switch to the active permission to claim your tokens.
                        </div>
                    </div>
                    <div v-else>
                        <div class="my-5">
                            <p>To claim your new EFFECT tokens on Solana, you’ll need to <u>verify ownership</u> of a
                                <b>BSC</b> or
                                <b>EOS</b> account
                                that held or staked EFX tokens on <u>{{ snapshotDate.toLocaleString() }}</u>.
                                You can repeat this process for every account you own that held or staked EFX tokens.
                            </p>
                        </div>
                        <ConnectSourceWalletForm />
                    </div>
                </div>
            </template>
            <template #solana>
                <div>
                    <!-- step 2 show claim / select / connect solana wallet  -->
                    <p>Next, we'll need your solana address, this is the address you will receive your new EFFECT tokens
                        on. </p>

                    <div v-if="!destinationAddress">
                        <div v-if="hasSolana">
                            <div class="flex flex-wrap justify-center items-center gap-2 my-8">
                                <span class="flex gap-2 items-center" >
                                    <WalletMultiButton /> or
                                </span> <a class="text-sm text-red-500 cursor-pointer"
                                    @click="toggleAddress = !toggleAddress">Manually
                                    enter your address</a>
                            </div>
                        </div>
                        <div class="flex w-full mt-3" v-show="!hasSolana || toggleAddress">
                            <UInput placeholder="Your solana address" v-model="manualAddressInput" type="text"
                                class="flex-grow h-full flex items-center justify-center min-h-[37px]" />
                            <UButton color="black" size="sm" @click="selectAddress" label="Confirm" />
                        </div>
                    </div>

                    <div class="justify-center mt-5 items-center gap-1" v-if="destinationAddress">
                        <b>Chosen address:</b>
                        <div class="flex justify-center gap-2">
                        <BlockchainAddress :address="destinationAddress" /> | <a class="cursor-pointer text-red-500"
                            @click="logout">Switch</a>
                        </div>
                        <div v-if="balanceLow">
                            <p class="text-red-500 mt-3">Your SOL balance is low, please top up your account.</p>
                        </div>
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
                    <div v-if="!migrationAccount" class="flex flex-col items-center">
                        <BlockchainAddress v-if="address" :address="address" />
                        <p>No active claims found for this account.</p>
                        <UButton class="mt-5" @click="disconnectSourceWallets" color="black" variant="outline">
                            Disconnect</UButton>
                    </div>

                    <div v-else class="text-center flex flex-col justify-center my-5">
                        <div v-if="!hasSolana && $device.isMobileOrTablet">
                            <h2 class="text-xl my-3 font-bold">Authentication and authorization via your mobile wallet
                                were successful! 🎉</h2>

                            To claim your tokens, we need to establish a connection to the Solana blockchain.
                            Unfortunately, your current browser or app doesn’t support this process.

                            Please open the link below on a desktop browser or within an in-app browser of a Solana mobile wallet to continue where you left off.

                            <div class="">
                                <div class="w-full">
                                    <UInput readonly :disabled="true" v-model="authorizeUrl" class="mt-5" type="text" />
                                </div>
                                <div class="flex gap-3 justify-center">
                                    <UButton v-if="isSupported" @click="shareAuthorize" class="mt-5" color="black"
                                        variant="outline">Share
                                        Authorization Link
                                        <UIcon name="lucide:share" class="" />
                                    </UButton>
                                    <UButton @click="copyAuthorize" class="mt-5" color="black" variant="outline">Copy
                                        <UIcon name="lucide:copy" class="" />
                                    </UButton>
                                </div>
                            </div>
                        </div>
                        <div v-else-if="!solanaWalletAddress">
                            <p>Please connect your solana wallet.</p>
                            <WalletMultiButton />
                        </div>
                        <div v-else>
                        
                            <p class="my-5">Claim your new EFFECT tokens on Solana.</p>

                            <ClaimCard :foreign-public-key="computedForeignPublicKey" :message="message"
                                :signature="signature" :migrationAccount="migrationAccount" />
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

const message: Ref<Uint8Array | null> = ref(null)
const signature: Ref<Uint8Array | null> = ref(null)
const manualForeignPublicKey: Ref<Uint8Array | null> = ref(null)

const computedForeignPublicKey: Ref<Uint8Array | null> = computed(() => manualForeignPublicKey.value || foreignPublicKey.value || null)

const hasSolana = computed(() => !!window.solana)

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

const { walletMeta, useGetForeignPublicKeyQuery, disconnect, authorizeTokenClaim, address, useGetEfxBalanceQuery, useGetNativeBalanceQuery } = useSourceWallet();
const { data: foreignPublicKey } = useGetForeignPublicKeyQuery()

const client = useQueryClient()
const disconnectSourceWallets = async () => {
    client.clear()
    disconnect()
    logout()
}

const toggleAddress = ref(false)
const manualAddress: Ref<string | null> = ref(null)
const manualAddressInput: Ref<string> = ref('')
const { address: solanaWalletAddress, useGetBalanceQuery } = useSolanaWallet()
const destinationAddress = computed(() => {
    return solanaWalletAddress.value || manualAddress.value
})
const { data: solanaDestinationBalance } = useGetBalanceQuery(destinationAddress)
const balanceLow = computed(() => solanaDestinationBalance.value && solanaDestinationBalance.value.value < 0.005)
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
    }
}

const { useGetMigrationAccount } = useMigrationProgram();
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

const toast = useToast()

const { share, isSupported } = useShare({})
const { copy } = useCopyToClipboard()
const copyAuthorize = () => {
    copy(authorizeUrl.value)
    toast.add({ title: 'Copied', description: 'Authorize link copied to clipboard', color: 'green' })
}

const shareAuthorize = () => {
    share({
        title: 'Authorize link',
        text: 'Authorize link',
        url: authorizeUrl.value,
    })

    toast.add({ title: 'Copied', description: 'Authorize link copied to clipboard', color: 'green' })
}

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
    if(!destinationAddress.value) {
        console.warn('No destination address')
        return
    }

    const result = await authorizeTokenClaim(destinationAddress.value)
    if (result) {
        message.value = result.message
        signature.value = result.signature
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

watch(currentStep, async (newVal) => {
    await new Promise(resolve => setTimeout(resolve, 10))
    const el = document.getElementById(`step-${newVal}`)
    if (el) {
        await nextTick();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
}, { immediate: true })


</script>

<style lang="scss" scoped></style>