<template>
  <div>
    <div>
      Worker node is listening on:
      {{ webRTCMultiaddr }}
    </div>
    <iframe :src="`${alternativeFrontendUrl}/template-proxy.html`" ref="mediaFrame"
      sandbox="allow-scripts allow-modals allow-downloads allow-forms allow-popups allow-popups-to-escape-sandbox allow-pointer-lock allow-same-origin"
      allow="geolocation; microphone; camera; autoplay; fullscreen" allowFullScreen>
    </iframe>
  </div>
</template>

<script setup lang="ts">
import { WebRTC } from '@multiformats/multiaddr-matcher'
import { type Multiaddr, multiaddr } from '@effectai/task-core';
import { WorkerNode } from "@effectai/task-worker";
import delay from 'delay'

const config = useRuntimeConfig();
const alternativeFrontendUrl = config.public.ALTERNATIVE_FRONTEND_URL;

let webRTCMultiaddr: Ref<Multiaddr | null | undefined> = shallowRef(null)

onMounted(async () => {
  // setup a listener node to listen for incoming connections
  const workerNode = new WorkerNode()
  await workerNode.start(15000);
  // dial the relay server
  await workerNode.node?.dial(multiaddr('/ip4/127.0.0.1/tcp/40591/ws/p2p/12D3KooWQBPqBN8qmbzpN5kYttT1brE1z1K98yXzxdsot77TcxWo'))
  
  workerNode.on('accept-task', () => {
    console.log('worker accepted task! refresh activeTask', workerNode.activeTask)
  })

  // wait for the listener to make a reservation on the relay
  while (true) {
    console.log("setting multiaddr", webRTCMultiaddr?.value)
    webRTCMultiaddr.value = workerNode.node?.getMultiaddrs().find(ma => WebRTC.matches(ma))

    if (webRTCMultiaddr.value != null) {
      break
    }

    // try again later
    await delay(1000)
  }

  // gossip send a message to worker-discovery topic
  // listener.services.pubsub.publish('worker-discovery', Buffer.from('hello from listener'))

  console.log('Worker node is listening on:', webRTCMultiaddr.value.toString())
})
</script>

<style scoped></style>