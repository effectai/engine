<template>
    <ol class="pb-72 mt-24">
        <li :id="`step-${key}`"
            class="relative border-t-[1px] flex-1 after:-z-10 after:bg-gray-100 after:inline-block"
            v-for="(item, key) in items">

            <div class="relative h-full flex py-32 items-center flex-col 
            ">
                <div v-if="!isActive(key)"
                    class="absolute w-full h-full black z-10 backdrop-blur-[3px] left-[0px] top-[0px] ">
                </div>

                <div class="flex flex-col w-full justify-center">

                    <span class="uppercase">Step {{ key + 1 }}</span>
                    <h2 class="mb-2 title  dark:text-white"> {{ item.label }}</h2>
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