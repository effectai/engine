<template>
	<div class="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
		<div
			class="absolute inset-0 bg-[url(/img/preview-bg.png)] bg-center bg-cover [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
		</div>
		<div
			class="absolute inset-1 bg-[url(/img/grid.svg)] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]">
		</div>
		<div
			class="relative font-mono bg-white px-6 pt-10 pb-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-2xl sm:rounded-lg sm:px-10">
			<div class="mx-auto max-w-lg text-center">
				<h1 class="text-xl font-mono">Worker Node V0</h1>
				<span class="text-sm">({{ peerIdFormatted }})</span>
				<div class="divide-y divide-gray-300/50">
					<div class="text-sm" v-if="managerPeers.length">paired to {{ managerPeers.length }} manager(s)
					
					</div>
					<div class="my-5 font-mono" v-if="isRunning">
						<div v-if="managerPeers.length == 0" class="mt-3 text-center">
							<p class="text-sm my-2">pairing with manager nodes</p>
							<UProgress></UProgress>
						</div>

						<div class="text-center my-5" v-else-if="!incomingTasks.size && !activeTask">
							<p class="text-sm">Awaiting tasks</p>
							<UProgress></UProgress>
						</div>
						<div v-else-if="activeTask" class="mt-5 bg-gray-200 p-3">
							<form @submit.prevent="submitTemplate">
								<div v-html="activeTask.compile()"></div>
							</form>
						</div>
						<div v-else-if="incomingTasks && incomingTasks.size > 0">
							<p class="mt-5 font-bold">Incoming tasks:</p>

							<div v-for="incomingTask in incomingTasks.values()">
								<div class="my-5 bg-slate-300 p-4 flex-col gap-3 flex">
									<p class="text-sm">Task ID: {{ incomingTask.task.id }}</p>
									<p class="text-sm">Task title: {{ incomingTask.task.data.title }}</p>
									<p class="text-sm">Task description: {{ incomingTask.task.data.description }}</p>
									<div class="flex gap-2 mt-5 justify-center">
										<UButton @click="acceptTask(incomingTask.task)">Accept Task</UButton>
										<UButton color="red" @click="rejectTask(incomingTask.task)">Reject Task </UButton>
									</div>
								</div>
							</div>
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
// connect to relay server
const { node, isRunning, peerIdFormatted, activeTask, incomingTasks, acceptTask, submitTask } =
	await useWorkerNode();

const { managerPeers, refreshPeers } = usePeerInfo(node.value);

// refresh peers every 5 seconds
const intervalId = setInterval(() => {
	console.log('refreshing peers', managerPeers.value);
	refreshPeers();
}, 5000);

onUnmounted(() => {
	clearInterval(intervalId);
});

const submitTemplate = async () => {
	submitTask(activeTask.value);
};

</script>

<style scoped></style>