<template>
  <div>
    Hello Worker Node!

    Your WebRTC multiaddr is: {{ webRTCMultiaddr?.toString() }}
  </div>
</template>

<script setup lang="ts">
export type { Stream } from '@libp2p/interface'
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import delay from 'delay'
import { WebRTC } from '@multiformats/multiaddr-matcher'
import { WorkerNode } from "@effectai/task-worker";

let webRTCMultiaddr: Ref<Multiaddr | null | undefined> = shallowRef(null)

onMounted(async () => {
  // setup a listener node to listen for incoming connections
  const workerNode = new WorkerNode()
  await workerNode.start(15000);

  // dial the relay server
  await workerNode.node?.dial(multiaddr('/ip4/127.0.0.1/tcp/40591/ws/p2p/12D3KooWQBPqBN8qmbzpN5kYttT1brE1z1K98yXzxdsot77TcxWo'))

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