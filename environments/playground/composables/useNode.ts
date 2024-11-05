import type { Libp2p, Libp2pNode, Peer, NodeEventMap } from "@effectai/task-core";

export const usePeerInfo = (node: Libp2p) => {

    const peers: Ref<Peer[]> = ref([]);

    const refreshPeers = async () => {
        if(!node) return;
        const result = await node.peerStore.all();
        console.log(result)
        peers.value = result;
    }

	const managerPeers = computed(() =>
		peers.value.filter(
			(peer: Peer) =>
				peer.tags.has("peerType") && peer.tags.get("peerType")?.value === 1,
		),
	);

    const workerPeers = computed(() =>
        peers.value.filter(
            (peer: Peer) =>
                peer.tags.has("peerType") && peer.tags.get("peerType")?.value === 0,
        ),
    );

    return {
        refreshPeers,
        managerPeers,
        workerPeers
    }
};

export const useNodes = () => {};
