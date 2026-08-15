import { type Multiaddr, multiaddr } from "@effectai/protocol-core";
import {
  createEffectEntity,
  generateKeyPairFromSeed,
  Libp2pTransport,
  PROTOCOL_NAME,
  PROTOCOL_VERSION,
  webSockets,
} from "@effectai/protocol-core";
import { EffectProtocolMessage } from "@effectai/protobufs";
import type { DeviceEntry } from "./useDeviceRegistration";

const POINTER_KEY = "worker-devices";

async function createTempEntity(privateKeyHex: string) {
  const privateKeyBytes = Buffer.from(privateKeyHex, "hex").slice(0, 32);
  const keypair = await generateKeyPairFromSeed("Ed25519", privateKeyBytes);

  return createEffectEntity({
    protocol: {
      name: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      scheme: EffectProtocolMessage,
    },
    transports: [
      new Libp2pTransport({
        privateKey: keypair,
        autoStart: false,
        listen: [],
        announce: [],
        transports: [webSockets()],
      }),
    ],
  });
}

async function fetchDevicesFromManager(
  privateKeyHex: string,
  managerHttpUrl: string,
): Promise<{ devices: DeviceEntry[]; managerP2pAddr: string } | null> {
  console.log("[recovery] fetching manager info from:", managerHttpUrl);
  let entity: Awaited<ReturnType<typeof createTempEntity>> | null = null;
  try {
    const response = await fetch(managerHttpUrl);
    const info = await response.json();
    const announced = info.addresses || info.announcedAddresses;
    if (!announced || announced.length === 0) return null;
    const managerP2pAddr = announced[0];

    const addr = multiaddr(managerP2pAddr);
    entity = await createTempEntity(privateKeyHex);
    await entity.node.start();

    const [ptrRes] = await entity.sendMessage(addr, {
      getPointer: { key: POINTER_KEY },
    });
    const ptr = ptrRes as any;
    if (!ptr?.found) return null;

    const [res] = await entity.sendMessage(addr, {
      getObject: { hash: ptr.value, limit: 0 },
    });
    const data = (res as any)?.items?.[0]?.data;
    if (!data) return null;

    const devices: DeviceEntry[] = JSON.parse(new TextDecoder().decode(data));
    if (devices.length === 0) return null;

    return { devices, managerP2pAddr };
  } catch (err) {
    console.error("[recovery] failed to fetch devices:", err);
    return null;
  } finally {
    if (entity) {
      try { await entity.node.stop(); } catch {}
    }
  }
}

export function useLoginRecovery() {
  const showRecovery = ref(false);
  const devices = ref<DeviceEntry[]>([]);
  let resolveChoice: ((modifier: string | null) => void) | null = null;

  const checkForRecovery = async (
    privateKeyHex: string,
  ): Promise<{ modifier: string; managerP2pAddr: string } | null> => {
    const config = useRuntimeConfig();
    const managers = config.public.EFFECT_MANAGERS as string[] | undefined;
    if (!managers || managers.length === 0) return null;

    for (const httpUrl of managers) {
      const result = await fetchDevicesFromManager(privateKeyHex, httpUrl);
      if (result && result.devices.length > 0) {
        devices.value = result.devices;
        const addr = result.managerP2pAddr;
        showRecovery.value = true;
        const modifier = await new Promise<string | null>((resolve) => {
          resolveChoice = resolve;
        });
        if (modifier) {
          return { modifier, managerP2pAddr: addr };
        }
        return null;
      }
    }
    return null;
  };

  const resolveRecovery = (modifierHex: string | null) => {
    resolveChoice?.(modifierHex);
    resolveChoice = null;
    showRecovery.value = false;
  };

  return { showRecovery, devices, checkForRecovery, resolveRecovery };
}