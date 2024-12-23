<template>
    <UCard class="max-w-md mx-auto bg-gray-50">
        <template #header>
            <div class="flex items-center justify-between">
                <h3 class="text-xl font-semibold text-gray-900">Migration Vault</h3>
                <UBadge color="gray" variant="subtle" v-if="vaultBalance">Active</UBadge>
                <UBadge color="red" variant="subtle" v-else>Claimed</UBadge>
            </div>
        </template>

        <div class="space-y-4">
            <div class="text-center">
                <p class="text-sm text-gray-600">Available Balance</p>
                <p class="text-3xl font-bold text-gray-900" v-if="balance">{{ balance }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-100 p-3 rounded-lg">
                    <p class="text-sm text-gray-600">Staked since</p>
                    <p class="font-medium text-gray-900">{{
                        formatTimestampToTimeAgo(migrationAccount.stakeStartTime.toNumber()
                            * 1000) }}</p>
                </div>
                <div class="bg-gray-100 p-3 rounded-lg">
                    <p class="text-sm text-gray-600">Claim Type</p>
                    <p class="font-medium text-gray-900">Staked</p>
                </div>
            </div>

            <div class="bg-gray-100 p-3 rounded-lg">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-sm text-gray-600 text-left">Stake Age</p>
                        <p class="font-medium text-gray-900">{{
                            formatNumber(calculateStakeAge(migrationAccount.stakeStartTime.toNumber())) }}</p>
                    </div>
                    <UIcon name="i-heroicons-chart-bar" class="text-gray-400 h-6 w-6" />
                </div>
            </div>
        </div>

        <template #footer>
            <UButton color="gray" variant="solid" size="lg" block :loading="isPending" :disabled="!canClaim"
                @click="handleClaim">
                Claim {{ balance }} EFFECT
            </UButton>
        </template>
    </UCard>
</template>

<script setup lang="ts">

const props = defineProps<{
    migrationAccount: EffectMigrationProgramAccounts['migrationAccount']
    signature: Uint8Array | null,
    foreignPublicKey: Uint8Array | null | undefined,
    message: Uint8Array | null
}>()


const { useGetMigrationVaultBalance, useClaim } = useMigrationProgram()
const { data: vaultBalance } = useGetMigrationVaultBalance(props.migrationAccount)

const balance = computed(() => vaultBalance.value?.value.uiAmount && formatNumber(vaultBalance.value?.value.uiAmount))

const canClaim = computed(() => {
    return !!props.signature && !!props.foreignPublicKey && !!props.message
})

const emit = defineEmits<(e: 'claim', transactionId: string) => void>()
const toast = useToast()
const { mutateAsync: claimTokens, isPending } = useClaim()
const handleClaim = async () => {
    try {

        if (!props.signature || !props.foreignPublicKey || !props.message) {
            console.warn('missing signature, foreignPublicKey or message')
            return
        }

        const transactionId = await claimTokens({ signature: props.signature, foreignPublicKey: props.foreignPublicKey, message: props.message })
        emit('claim', transactionId)
        toast.add({ title: 'Success', description: 'Claimed tokens successfully', color: 'green' })
    } catch (e) {
        console.log(e)
        toast.add({ title: 'Error', description: "Something went wrong", color: 'red' })
    }
}

</script>