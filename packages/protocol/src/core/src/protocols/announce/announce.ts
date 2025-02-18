import {
  publicKeyFromProtobuf,
  publicKeyToProtobuf,
} from "@libp2p/crypto/keys";
import {
  type NodeInfo,
  type PeerDiscoveryEvents,
  type PeerId,
  type PeerInfo,
  type PeerStore,
  type PubSub,
  type Startable,
  TypedEventEmitter,
} from "@libp2p/interface";
import type { AddressManager } from "@libp2p/interface-internal";
import { peerIdFromPublicKey } from "@libp2p/peer-id";
import { multiaddr } from "@multiformats/multiaddr";
import { Peer as PBPeer, Type } from "./pb/announce.js";

export interface AnnouncePeerDiscoveryComponents {
  peerId: PeerId;
  peerStore: PeerStore;
  addressManager: AddressManager;
  pubsub?: PubSub;
  nodeInfo: NodeInfo;
}

export class AnnouncePeerDiscovery
  extends TypedEventEmitter<PeerDiscoveryEvents>
  implements Startable
{
  private components: AnnouncePeerDiscoveryComponents;
  private intervalId: NodeJS.Timeout | null;

  constructor(components: AnnouncePeerDiscoveryComponents) {
    super();

    this.components = components;
    this.intervalId = null;
  }

  start(): void | Promise<void> {}

  isStarted(): boolean {
    return this.intervalId != null;
  }

  afterStart() {
    if (!this.components.pubsub) {
      throw new Error("Pubsub is not available");
    }

    this.components.pubsub.subscribe("effectai-announce");
    this.components.pubsub.addEventListener("message", ({ detail }) => {
      if (!this.isStarted()) {
        return;
      }

      try {
        const peer = PBPeer.decode(detail.data);
        const publicKey = publicKeyFromProtobuf(peer.publicKey);
        const peerId = peerIdFromPublicKey(publicKey);

        //update peerStore with peer
        this.components.peerStore.merge(peerId, {
          metadata: {
            nodeType: Uint8Array.from([peer.type]),
          },
        });

        // Ignore if we received our own response
        if (peerId.equals(this.components.peerId)) {
          return;
        }

        this.safeDispatchEvent<PeerInfo>("peer", {
          detail: {
            id: peerId,
            //@ts-ignore
            multiaddrs: peer.addrs.map((b) => multiaddr(b)),
          },
        });
      } catch (err) {
        console.error("Failed to decode announce message", err);
      }
    });

    this._broadcast();

    this.intervalId = setInterval(() => {
      this._broadcast();
    }, 1000);
  }

  stop() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.components.pubsub?.unsubscribe("announce");
    this.components.pubsub?.removeEventListener("message");
  }

  _broadcast() {
    const peerId = this.components.peerId;

    if (peerId.publicKey == null) {
      throw new Error("PeerId was missing public key");
    }

    const peer = {
      publicKey: publicKeyToProtobuf(peerId.publicKey),
      type: Type.WORKER,
      addrs: this.components.addressManager
        .getAddresses()
        .map((ma: any) => ma.bytes),
    };

    const encodedPeer = PBPeer.encode(peer);
    const pubsub = this.components.pubsub;

    if (!pubsub) {
      throw new Error("Pubsub is not available");
    }

    if (pubsub.getSubscribers("effectai-announce").length === 0) {
      // console.warn("No subscribers for effectai-announce");
      return;
    }

    void pubsub.publish("effectai-announce", encodedPeer);
  }
}

export function announcePeerDiscovery(): (
  components: AnnouncePeerDiscoveryComponents
) => AnnouncePeerDiscovery {
  return (components: AnnouncePeerDiscoveryComponents) =>
    new AnnouncePeerDiscovery(components);
}
