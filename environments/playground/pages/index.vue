<template>
    <div class="split-container">
        <section class="worker-section">
            <div class="flex flex-col my-5 text-center">
                Worker Node
                <div v-if="worker.state.activeTask" class="bg-white p-5 text-black">
                    Active task:
                    <div>{{ worker.state.activeTask.id }}</div>
                    <div>{{ worker.state.activeTask.data }}</div>
                    <UButton @click="worker.submitTask(worker.state.activeTask)">Complete</UButton>
                </div>
                <div v-else-if="worker.state.incomingTasks.size > 0">
                    Incoming task:
                    <div v-for="({ task }, i) in worker.state.incomingTasks.values()">
                        <div>{{ task.id }}</div>
                        <div>{{ task.data }}</div>

                        <UButton @click="worker.acceptTask(task)">Accept</UButton>
                    </div>
                </div>
            </div>
        </section>
        <section class="manager-section">
            <div class="flex flex-col my-5 text-center">
                <h2 class=block> Manager Node</h2>
                <div class="block" v-if="manager.state.activeBatch">
                    Active batch

                    <!-- show taskmap -->
                    <div class="block bg-white p-3 text-black" v-for="{ activeWorkerPeerId, status, updatedAt } in managerTaskMap.values()">
                        <!-- <div>TaskId: {{ sliceBoth(taskId) }}</div> -->
                        <div>activeWorker: {{ sliceBoth(activeWorkerPeerId) }}</div>
                        <div>status: {{ status }}</div>
                    </div>
                </div>
            </div>
        </section>
        <section class="relay-section bg-red-500">
            <div class="text-center flex flex-col">
                <h2 class="text-2xl flex justify-center gap-5">Provider Node
                </h2>
                <div>
                    <UButton @click="offerBatchToNetwork">Post Batch</UButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { createManagerNode } from "@effectai/task-manager";
import { createProviderNode, offerBatch } from "@effectai/task-provider";
import { createWorkerNode } from "@effectai/task-worker";
import { exampleBatch } from "~/constants/exampleBatch";

const config = useRuntimeConfig();
const bootstrapNode = config.public.BOOTSTRAP_NODE;

const provider = await createProviderNode([bootstrapNode]);
await provider.start();

const worker = ref(await createWorkerNode([bootstrapNode]));
await worker.value.start();
await worker.value.listenForTask();

const manager = ref(await createManagerNode([bootstrapNode]))
await manager.value.start();

const managerTaskMap = ref(new Map());
manager.value.addListener("state:updated", (state) => {
    console.log("Manager state change", state);
    managerTaskMap.value = state.taskMap;
});

const offerBatchToNetwork = async () => {
    await provider.offerBatch(manager.value.node.getMultiaddrs()[0], exampleBatch);
};

onBeforeUnmount(async () => {
    await provider.stop();
    await worker.value.stop();
    await manager.value.stop();
});
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