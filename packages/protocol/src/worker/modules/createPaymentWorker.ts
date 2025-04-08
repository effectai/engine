import type { PeerId } from "@libp2p/interface";
import type { createEffectEntity } from "../../core/entity/factory.js";
import type { EffectProtocolMessage } from "../../core/messages/effect.js";
import type { Libp2pTransport } from "../../core/transports/libp2p.js";
import type { WorkerTaskStore } from "../stores/workerTaskStore.js";

export function createPaymentWorker({
  taskStore,
  worker,
}: {
  taskStore: WorkerTaskStore;
  worker: Awaited<ReturnType<typeof createEffectEntity<Libp2pTransport[]>>>;
}) {
  const requestPayout = async ({
    managerPeer,
  }: {
    managerPeer: PeerId;
  }) => {
    const requestPayoutMessage: EffectProtocolMessage = {
      payoutRequest: {
        peerId: worker.getPeerId().toString(),
      },
    };

    const payment = worker.sendMessage(managerPeer, requestPayoutMessage);
  };

  return {
    requestPayout,
  };
}
