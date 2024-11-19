<template>
    <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ sliceBoth(address) }}</span>
        <button @click="copyAddress"
            class="text-gray-500 flex hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            :title="copied ? 'Copied!' : 'Copy address'">
            <UIcon class="h-4 w-4" name="lucide:copy" />
        </button>
    </div>
</template>

<script setup lang="ts">
const props = defineProps({
    address: {
        required: true,
        type: String,
    },
})

const copied = ref(false)

const { copy } = useCopyToClipboard()
const copyAddress = () => {
    copy(props.address)
    copied.value = true
}

</script>

<style scoped></style>