<template>
    <nav class="flex flex-1 flex-col">
        <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
                <ul role="list" class="-mx-2 space-y-1">
                    <li v-for="item in navigation" :key="item.name">
                        <nuxt-link :to="item.href"
                            :class="[item.current ? 'bg-gray-100 dark:bg-gray-800' : '', 'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold']">
                            <UIcon :name="item.icon"
                                :class="[item.current ? '' : 'group-hover:text-gray-500', 'size-6 shrink-0']"
                                aria-hidden="true" />

                            {{ item.name }}
                        </nuxt-link>
                    </li>
                </ul>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">

const route = useRoute()

const navigation = ref([
    // { name: 'Dashboard', href: '/', icon: 'lucide:home', current: computed(() => route.path === '/') },
    { name: 'Stake', href: '/stake', icon: 'lucide:wallet', current: computed(() => route.path.includes('/stake')) },
    { name: 'Migrate', href: '/migrate/step/connect', icon: 'lucide:forward', current: computed(() => route.path.includes('migrate')) },
])
</script>

<style scoped>


</style>