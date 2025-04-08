import { beforeEach, describe, expect, it, vi } from "vitest";
import { Libp2pTransport } from "./libp2p.js";
import { webSockets } from "@libp2p/websockets";
import { identify } from "@libp2p/identify";
import { createLibp2p } from "libp2p";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { EffectProtocolMessage } from "../common/index.js";

describe("Libp2pTransport", () => {
  vi.mock("libp2p", () => ({
    createLibp2p: vi.fn().mockResolvedValue({
      getMultiaddrs: vi.fn().mockReturnValue(["ip4/192.167.0.1/tcp/34860/ws"]),
      addEventListener: vi.fn(),
      status: expect.any(String),
      start: vi.fn(),
      handle: vi.fn(),
      register: vi.fn(),
      stop: vi.fn(),
      safeDispatchEvent: vi.fn(),
      services: {
        identify: {
          on: vi.fn(),
        },
      },
    }),
  }));

  it("should create a Libp2pTransport instance", () => {
    const libp2p = new Libp2pTransport({
      listen: ["/dns4/0.0.0.0/tcp/34860/ws"],
      services: {},
      protocol: {
        name: "/effectai/1.0.0",
        scheme: EffectProtocolMessage,
      },
      bootstrap: [],
      transports: [webSockets()],
      autoStart: false,
    });

    expect(libp2p).toBeDefined();
  });

  it("should initialize with default options", async () => {
    const libp2p = new Libp2pTransport({
      listen: ["/dns4/0.0.0.0/tcp/34860/ws"],
      services: {},
      protocol: {
        name: "/effectai/1.0.0",
        scheme: EffectProtocolMessage,
      },
      bootstrap: [],
      transports: [webSockets()],
      autoStart: false,
    });

    await libp2p.initialize({} as any);

    expect(libp2p).toBeDefined();
  });

  it("should start the Libp2p node", async () => {
    const libp2p = new Libp2pTransport({
      listen: ["/dns4/0.0.0.0/tcp/34860/ws"],
      services: {},
      protocol: {
        name: "/effectai/1.0.0",
        scheme: EffectProtocolMessage,
      },
      bootstrap: [],
      transports: [webSockets()],

      autoStart: true,
    });

    await libp2p.initialize({} as any);
    expect(libp2p.node).toBeDefined();
    expect(libp2p.node?.status).toStrictEqual("started");

    //stop node
    await libp2p.node?.stop();
  });

  it("should have a multiaddress", async () => {
    const libp2p = new Libp2pTransport({
      listen: ["/dns4/0.0.0.0/tcp/34860/ws"],
      services: {},
      protocol: {
        name: "/effectai/1.0.0",
        scheme: EffectProtocolMessage,
      },
      bootstrap: [],
      transports: [webSockets()],

      autoStart: true,
    });

    await libp2p.initialize({} as any);
    const multiaddrs = libp2p.getMultiAddress();

    expect(multiaddrs).toBeDefined();
    expect(multiaddrs.length).toBeGreaterThan(0);
    expect(multiaddrs[0]).toBeDefined();
  });
});
