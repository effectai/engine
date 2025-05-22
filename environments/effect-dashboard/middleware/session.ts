import { multiaddr, peerIdFromString } from "@effectai/protocol";

export default defineNuxtRouteMiddleware(async (to) => {
  const sessionStore = useSessionStore();
  const workerStore = useWorkerStore();
  const authStore = useAuthStore();

  const { connectedOn } = storeToRefs(sessionStore);

  // //check if we manager peer Id in the route.
  const { manager } = to.params;

  //check if we have an active session
  if (!connectedOn.value) {
    //if no active session, and manager is in the route, connect to it.

    await new Promise((resolve) => {
      const unsubscribe = workerStore.$subscribe((mutation, state) => {
        if (state.worker) {
          unsubscribe(); // Clean up the subscription
          resolve(true);
        }
      });
    });

    if (!workerStore.worker) {
      throw new Error("Worker not initialized");
    }

    const peer = await workerStore.worker.entity.node.peerStore.get(
      peerIdFromString(manager as string),
    );

    if (!authStore.account) {
      throw new Error("No account found");
    }

    if (!peer || !peer.addresses[0]) {
      return navigateTo("/worker/connect");
    }

    //add peer to the address
    await sessionStore.connect({
      //TODO:: this seems incorrect
      managerMultiAddress: multiaddr(
        peer.addresses[0].multiaddr.toString() + "/p2p/" + peer.id.toString(),
      ),
      account: authStore.account,
      currentNonce: 0n,
    });
  }
});
