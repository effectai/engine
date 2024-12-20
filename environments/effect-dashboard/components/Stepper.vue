<template>
    <ol class="pb-72 mt-24">
        <li :id="`step-${key}`"
            class=" relative py-36 flex-1 after:content-[''] after:-z-10 after:w-0.5 after:h-[999%] after:bg-gray-100 after:inline-block after:absolute after:-bottom-11 after:left-4 lg:after:left-5"
            v-for="(item, key) in items">
            <span :class="{ 'is-active': isActive(key) && !item.isCompleted }"
                class="step ml-[1px] after:bg-gray-500 before:bg-white w-8 h-8 aspect-square bg-black dark:bg-white dark:text-black border-2 border-transparent rounded-full flex justify-center items-center mr-3 text-sm text-white lg:w-10 lg:h-10">
                <div v-if="item.isCompleted" class="flex justify-center items-center">
                    <UIcon name="lucide:check" class="w-6 h-6" />
                </div>
                <div v-else>
                    {{ key + 1 }}</div>
            </span>

            <div class="relative ml-10 h-full lg:ml-12 flex -mt-[32px] items-center flex-col 
            ">
                <div v-if="!isActive(key)"
                    class="absolute w-full h-full black z-10 backdrop-blur-[3px] left-[0px] top-[0px] ">
                </div>

                <div class="flex flex-col w-full justify-center">
                    <h2 class="mb-2 title  dark:text-white"> {{ item.label }}</h2>
                    <UDivider class="my-5" />
                    <p>
                        <slot :isCompleted="item.isCompleted" :name="item.slot"></slot>
                    </p>
                </div>
            </div>
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
    text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.step.is-active {
    position: relative;
    overflow: hidden;
    border-radius: 9999%;
    border: none;
    color: #e0ffff;
    font-weight: 500;
    z-index: 1;

    &::before {
        content: '';
        position: absolute;
        inset: 5px 4px;
        // background: #bdbec5;
        transition: 500ms;
        animation: rotate 5s linear infinite;
        z-index: -1;
    }
    &::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        // background: #22232e;
        z-index: -1;
    }
}

@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.border-animated {
    transition: border-color 0.5s;
    animation: border-glow 1.5s infinite;
    border-width: 2px;
}
</style>