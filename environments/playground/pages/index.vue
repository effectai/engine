<template>
    <div class="split-container">
        <section class="worker-section">
            <div class="flex flex-col my-5 text-center">
                Worker Node
                <div v-if="!webRTCMultiAddress">
                    <UButton @click="connectToRelay">Connect to Relay server</UButton>
                </div>
                <div v-else>
                    <UBadge>Connected</UBadge>
                    <p class="my-3"> {{ trimOnBothEnds(webRTCMultiAddress.toString(), 10) }}</p>


                    <div v-if="incomingTask" class="bg-white p-5 text-[black]">
                        <h2 class="text-2xl">Incoming Task</h2>

                        <div class="flex flex-col gap-2 ">
                            <div>
                                <p>Task ID: {{ incomingTask.id }}</p>
                            </div>
                            <div>
                                <p>Difficulty: 1/5</p>
                            </div>
                            <div>
                                <p class="text-sm">Task Description: Lorem ipsum dolor sit amet</p>
                            </div>

                            <div class="flex gap-3 justify-center my-5"> 
                                <UButton color="green" @click="incomingTask.accept()">Accept Task</UButton>
                                <UButton color="red" @click="incomingTask.reject()">Reject Task</UButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <section class="manager-section">
            <div>
                Manager Node
                <UBadge v-if="managerNode.node?.status == 'started'">running</UBadge>
                <div v-if="managerNode.node?.status !== 'started'">
                    <UButton @click="startManagerNode">start</UButton>
                </div>
                <div v-else class="flex gap-2 my-3">
                    <UButton color="red">stop</UButton>
                    <UButton color="indigo" @click="delegateTask">Delegate Task</UButton>
                </div>
            </div>
        </section>
        <section class="relay-section bg-red-500">
            <div class="text-center flex flex-col">
                <h2 class="text-2xl flex justify-center gap-5">Relay Node
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
import { multiaddr, Task, WebRTC, type Multiaddr } from "@effectai/task-core";
import { WorkerNode } from "@effectai/task-worker";
import {
    delegateTaskToWorker,
    ManagerNode,
} from "../../../packages/manager/dist";
import { exampleBatch } from "~/constants/exampleBatch";

const relayAddress =
    "/ip4/127.0.0.1/tcp/32989/ws/p2p/12D3KooWG8Kb4xjLhMbb2pDTsuLNN9doFE6ppUhQ29Bp6vnNP6y4";
const webRTCMultiAddress = shallowRef<Multiaddr | null | undefined>(null);
const workerNode = shallowRef(new WorkerNode());
const managerNode = ref(new ManagerNode());


const incomingTask = ref<Task | null>(null);
workerNode.value.on("incoming-task", (task: Task) => {
    console.log("Incoming task", task);
    incomingTask.value = task;
});

const startManagerNode = async () => {
    await managerNode.value.init();

    // register event listeners
    managerNode.value.on("state:updated", (state) => {
        console.log("state:updated", state);
    });

    managerNode.value.on("initialized", (worker) => {
        console.log("Manager initialized", worker);
    });

    managerNode.value.on("node:started", (node) => {
        console.log("Node started", node.status);
    });

    // start the manager node
    await managerNode.value.start();
};

const delegateTask = async () => {
    try {
        // dial the worker node through the multiaqddress
        if (!webRTCMultiAddress.value) {
            console.error("WebRTC Multiaddress not found");
            return;
        }

        const tasks = exampleBatch.extractTasks();

        if (!managerNode.value.node) {
            console.error("Manager node not found");
            return;
        }

        await delegateTaskToWorker(
            managerNode.value.node,
            webRTCMultiAddress.value,
            tasks[0],
        );

        console.log("Task delegated");
    } catch (e) {
        console.error(e);
    }
};

const trimOnBothEnds = (str: string, length: number) => {
    return `${str.substring(0, length)}...${str.substring(str.length - length, str.length)}`;
};

const connectToRelay = async () => {
    try {
        await workerNode.value.init();
        await workerNode.value.start();
        await workerNode.value.node?.dial(multiaddr(relayAddress));

        while (true) {
            webRTCMultiAddress.value = workerNode.value.node
                ?.getMultiaddrs()
                .find((ma) => WebRTC.matches(ma));

            if (webRTCMultiAddress.value != null) {
                break;
            }

            // try again every second
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    } catch (e) {
        console.error(e);
    }
};
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