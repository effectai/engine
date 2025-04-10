import type { PeerId } from "@libp2p/interface";
import type { WorkerTaskStore } from "../stores/workerTaskStore.js";
import { WorkerEntity } from "../main.js";

export function createPaymentWorker({
  taskStore,
  entity,
}: {
  taskStore: WorkerTaskStore;
  entity: WorkerEntity;
}) {
  const requestPayout = async ({
    managerPeer,
  }: {
    managerPeer: PeerId;
  }) => {
    const requestPayoutMessage = {
      payoutRequest: {
        peerId: entity.getPeerId().toString(),
      },
    };

    const payment = await entity.sendMessage(managerPeer, requestPayoutMessage);
  };

  return {
    requestPayout,
  };
}
