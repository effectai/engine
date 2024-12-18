<template>
    <ol class="space-y-64">
        <li class="relative flex-1 after:content-[''] after:-z-10 after:w-0.5 after:h-[999%] after:bg-gray-600 after:inline-block after:absolute after:-bottom-11 after:left-4 lg:after:left-5"
            v-for="(item, key) in items">
            <span
                class="w-8 h-8 aspect-square bg-gray-600 border-2 border-transparent rounded-full flex justify-center items-center mr-3 text-sm text-white lg:w-10 lg:h-10">
                <div v-if="item.isCompleted" class="flex justify-center items-center">
                    <UIcon name="lucide:check" class="w-6 h-6" />
                </div>
                <div v-else>
                {{ key + 1 }}</div>
            </span>

            <UCard class="block ml-10 h-full">
                <div v-if="!isActive(key)" class="absolute w-full h-full black z-10 backdrop-blur-[3px] top-[10px] left-30px"></div>
                <h3 class="text-base mb-2 title"> {{ item.label }}</h3>
                <UDivider class="my-5"/>

                <p>
                    <slot :isCompleted="item.isCompleted" :name="item.slot"></slot>
                </p>
            </UCard>
        </li>
    </ol>

</template>

<script setup lang="ts">
const props = defineProps<{
    items: {
        isCompleted?: boolean
        slot: string
        label: string
    }[]
    currentStep: number
}>()

const isActive = (key: number) => {
    // item is active if the previous item is completed
    return key <= props.currentStep
} 
</script>

<style lang="scss" scoped>

.blurry-text {
    filter: blur(0.5px);
    color: transparent;
    text-shadow: 0 0 5px rgba(0,0,0,0.5);
}
</style>