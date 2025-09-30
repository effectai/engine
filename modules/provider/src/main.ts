import { EffectProtocolMessage } from "@effectai/protobufs";
import {
  circuitRelayTransport,
  createEffectEntity,
  Libp2pTransport,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  webSockets,
  type Datastore,
  type PrivateKey,
} from "@effectai/protocol-core";

export const createProviderEntity = async ({
  datastore,
  privateKey,
}: {
  datastore: Datastore;
  privateKey: PrivateKey;
}) => {
  return await createEffectEntity({
    protocol: {
      name: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      scheme: EffectProtocolMessage,
    },
    transports: [
      new Libp2pTransport({
        privateKey,
        datastore,
        autoStart: false,
        listen: ["/p2p-circuit", "/webrtc"],
        announce: [],
        transports: [webSockets(), circuitRelayTransport()],
      }),
    ],
  });
};

export const createProviderNode = () => {};
