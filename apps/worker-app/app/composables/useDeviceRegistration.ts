import { type Multiaddr } from "@effectai/protocol-core";

interface DeviceEntry {
  modifier: string; // hex of the seed modifier's first 4 bytes
  address: string; // Solana address derived from the modified seed
  created: number; // Date.now()
  meta: string; // navigator.userAgent
}

const POINTER_KEY = "worker-devices";

async function fetchDeviceList(
  entity: any,
  manager: Multiaddr,
  hash: string,
): Promise<DeviceEntry[]> {
  const [res, err] = await entity.sendMessage(manager, {
    getObject: { hash },
  });
  if (err) throw new Error("Failed to fetch device list");
  const data = (res as any)?.items?.[0]?.data;
  if (!data) return [];
  return JSON.parse(new TextDecoder().decode(data));
}

async function storeDeviceList(
  entity: any,
  manager: Multiaddr,
  devices: DeviceEntry[],
): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(devices));
  const [res, err] = await entity.sendMessage(manager, {
    storeObject: { data: bytes },
  });
  if (err) throw new Error("Failed to store device list");
  const hash = (res as any)?.hash;
  if (!hash) throw new Error("Failed to store device list");
  return hash;
}

export function useDeviceRegistration() {
  const { account } = useAuth();

  const registerDevice = async (managerMultiaddr: Multiaddr): Promise<void> => {
    const workerStore = useWorkerStore();
    const entity = workerStore.instance?.entity;
    if (!entity) throw new Error("Worker not initialized");

    // Get the seed modifier — this is the per-device identity
    const modifier = localStorage.getItem("modifier");
    if (!modifier) throw new Error("No seed modifier found");
    const modifierHex = Buffer.from(modifier).slice(0, 4).toString("hex");

    // Fetch the current worker-devices pointer
    const [ptrRes, ptrErr] = await entity.sendMessage(managerMultiaddr, {
      getPointer: { key: POINTER_KEY },
    });
    if (ptrErr) throw new Error("Failed to fetch device list");

    const ptr = (ptrRes as any);
    let devices: DeviceEntry[] = [];
    let currentHash: string | null = null;

    if (ptr?.found) {
      currentHash = ptr.value;
      devices = await fetchDeviceList(entity, managerMultiaddr, currentHash);
    }

    // Device already registered, short circuit
    if (devices.some((d) => d.modifier === modifierHex)) return;

    // Append our device
    const address = account.value;
    if (!address) throw new Error("No account address available");
    const entry: DeviceEntry = {
      modifier: modifierHex,
      address,
      created: Date.now(),
      meta: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
    devices.push(entry);

    const newHash = await storeDeviceList(entity, managerMultiaddr, devices);

    // CAS-update the pointer
    const [setRes, setErr] = await entity.sendMessage(managerMultiaddr, {
      setPointer: {
        key: POINTER_KEY,
        value: newHash,
        ...(currentHash ? { expected: currentHash } : {}),
      },
    });
    if (setErr || ((setRes as any) && !(setRes as any).updated)) {
      throw new Error("We failed to register your device. Please try again.");
    }

    // Clean up old object
    if (currentHash) {
      const [, delErr] = await entity.sendMessage(managerMultiaddr, {
        deleteObject: { hash: currentHash },
      });
      if (delErr) {
        console.error("Failed to delete old device list object:", delErr.message);
      }
    }
  };

  return { registerDevice };
}
