<template>
    <span>
        {{ animatedValue }}
        <slot v-if="isAnimating" name="animating"></slot>
    </span>
</template>

<script setup lang="ts">
const props = defineProps({
    value: {
        required: true,
        type: Number,
    },
    duration: {
        type: Number,
        default: 3000,
    },
    easing: {
        type: String,
        default: "linear",
    },
    format: {
        type: Function,
        default: (value: number) => value.toFixed(2),
    },
})

const animatedValue = ref(props.value)
const isAnimating = ref(false)

watch(() => props.value, (newValue, oldValue) => {
    if (newValue !== oldValue) {
        animateValue(oldValue, newValue)
    }
})

onMounted(() => {
    animateValue(0, props.value)
})

const animateValue = (start: number, end: number) => {
    let startTimestamp: number | null = null
    isAnimating.value = true
    const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / props.duration, 1)
        const easedProgress = easing(progress)

        animatedValue.value = props.format(start + (end - start) * easedProgress)

        if (progress < 1) {
            window.requestAnimationFrame(step)
        } else {
            isAnimating.value = false
        }
    }
    window.requestAnimationFrame(step)
}

const easing = (progress: number) => {
    switch (props.easing) {
        case "linear":
            return progress
        case "easeInQuad":
            return progress ** 2
        case "easeOutQuad":
            return progress * (2 - progress)
        case "easeInOutQuad":
            return progress < 0.5 ? 2 * progress ** 2 : -1 + (4 - 2 * progress) * progress
        case "easeInCubic":
            return progress ** 3
        case "easeOutCubic":
            return 1 + (progress - 1) ** 3
        case "easeInOutCubic":
            return progress < 0.5 ? 4 * progress ** 3 : (progress - 1) * (2 * progress - 2) ** 2 + 1
        case "easeInQuart":
            return progress ** 4
        case "easeOutQuart":
            return 1 - (progress - 1) ** 4
        case "easeInOutQuart":
            return progress < 0.5 ? 8 * progress ** 4 : 1 - 8 * (progress - 1) ** 4
        case "easeInQuint":
            return progress ** 5
        case "easeOutQuint":
            return 1 + (progress - 1) ** 5
        case "easeInOutQuint":
            return progress < 0.5 ? 16 * progress ** 5 : 1 + 16 * (progress - 1) ** 5
        default:
            return progress
    }
}

</script>

<style scoped></style>