<template>
    <div>
        <UTabs :items="items">
            <template #overview="{ item }">
                <div class="p-4">
                    <StakeOverviewCard />
                </div>
            </template>
            <template #stake>
                <StakingForm/>
            </template>
        </UTabs>
    </div>
</template>

<script setup lang="ts">
const items = [{
    slot: 'overview',
    label: 'Overview',
    icon: 'i-heroicons-eye-dropper',
    content: 'Finally, this is the content for Tab3'
}, {
    slot: 'stake',
    label: 'Stake',
    icon: 'i-heroicons-information-circle',
    content: 'This is the content shown for Tab1'
}, {
    slot: 'unstake',
    label: 'Unstake',
    icon: 'i-heroicons-arrow-down-tray',
    disabled: true,
    content: 'And, this is the content for Tab2'
}]
</script>

<style scoped></style>