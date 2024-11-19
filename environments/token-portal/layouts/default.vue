<template>
    <UContainer class="mt-5">
        <main class="container max-w-xl mx-auto">
            <h1 class="text-3xl font-bold text-gray-800">
                <slot name="title">Effect AI: Token Migration Portal</slot>
            </h1>
            <h2 class="subtitle text-xl text-gray-600 mt-2"></h2>


            <Progress class="my-10" />

            <UDivider class="my-10" />
            <slot></slot>
        </main>

    </UContainer>

    <UModals />
    <UNotifications />
</template>

<script setup lang="ts">

</script>

<style scoped></style>