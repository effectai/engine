import type { PeerId } from "@libp2p/interface";
import { EffectProtocolMessage } from "../../common/index.js";
import { WorkerTaskStore } from "../stores/workerTaskStore.js";
import { createEffectEntity } from "../../entity/factory.js";
import { Libp2pTransport } from "../../transports/libp2p.js";

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
