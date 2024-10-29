import type { Libp2p, Libp2pNode, Peer, NodeEventMap } from "@effectai/task-core";

const peers: Ref<Peer[]> = ref([]);

export const usePeerInfo = (node: Ref<Libp2pNode | null>) => {

    const refreshPeers = async () => {
        if(!node.value?.node) return;
        peers.value = await node.value.node.peerStore.all();
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

export const useManagerNode = () => {};

export const useNodes = () => {};
