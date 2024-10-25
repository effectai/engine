<template>
    <div class="split-container">
        <section class="worker-section">
            <div class="flex flex-col my-5 text-center">
                Worker
                <div v-if="!webRTCMultiAddress">
                    <UButton @click="connectToRelay">Connect to Relay server</UButton>
                </div>
                <div v-else>
                    <UBadge>Connected</UBadge>
                    <p class="my-3"> {{ trimOnBothEnds(webRTCMultiAddress.toString(), 10) }}</p>
                </div>
            </div>
        </section>
        <section class="manager-section">
            <div>
                Manager
                <div v-if="managerNode.node?.status !== 'started'">
                    <UButton @click="startManagerNode">start</UButton>
                </div>
            </div>
        </section>
        <section class="relay-section bg-red-500">
            <div class="text-center flex flex-col">
                <h2 class="text-2xl flex justify-center gap-5">Relay Server
                    <UBadge>running</UBadge>
                </h2>
                <div>
                    <p class="text-sm my-3" v-if="relayAddress"> {{ trimOnBothEnds(relayAddress, 15) }}</p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { multiaddr, WebRTC, type Multiaddr } from '@effectai/task-core';
import { WorkerNode } from '@effectai/task-worker';
import { ManagerNode } from '../../../packages/manager/dist';

const relayAddress = '/ip4/127.0.0.1/tcp/39721/ws/p2p/12D3KooWEhXeSTveDYD8Z437No7Gj96R7MqLnLUXkjYEKVhehP4c'
const webRTCMultiAddress = shallowRef<Multiaddr | null | undefined>(null);
const workerNode = shallowRef(new WorkerNode());
const managerNode = shallowRef(new ManagerNode());

const startManagerNode = async () => {
    await managerNode.value.init();

    managerNode.value.on('state:updated', (state) => {
        console.log('state:updated', state);
    });

}

const trimOnBothEnds = (str: string, length: number) => {
    return `${str.substring(0, length)}...${str.substring(str.length - length, str.length)}`
}

const connectToRelay = async () => {
    await workerNode.value.start();
    await workerNode.value.node?.dial(multiaddr(relayAddress));

    while (true) {
        webRTCMultiAddress.value = workerNode.value.node?.getMultiaddrs().find(ma => WebRTC.matches(ma))

        if (webRTCMultiAddress.value != null) {
            break
        }

        // try again every second
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

}

</script>

<style scoped>
.split-container {
    display: grid;
    grid-template-rows: 1fr 2fr;
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
        "header header"
        "left right";
    height: 100vh;
    width: 100vw;
}

.worker-section {
    grid-area: header;
    background-color: #4CAF50;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
}

.manager-section,
.relay-section {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
}

.manager-section {
    grid-area: left;
    background-color: #2196F3;
}

.relay-section {
    grid-area: right;
}

section {
    padding: 20px;
}
</style>