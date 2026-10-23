import { type Datastore, Key } from "@effectai/protocol-core";

export interface PointerEntry {
  key: string;
  value: string; // content hash the pointer resolves to
}

/**
 * A simple per-key async mutex so compare-and-swap read/examine/write
 * sequences are atomic against concurrent updates within this process.
 */
class KeyedMutex {
  private queues = new Map<string, Promise<void>>();

  async withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => (release = resolve));
    const chain = prev.then(() => next);
    this.queues.set(key, chain);
    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (this.queues.get(key) === chain) {
        this.queues.delete(key);
      }
    }
  }
}

export const createStoragePointerStore = ({
  datastore,
}: {
  datastore: Datastore;
}) => {
  const PREFIX = "storage-pointer";
  const lock = new KeyedMutex();

  const pointerKey = (owner: string, key: string) =>
    new Key(`/${PREFIX}/${owner}/${key}`);

  const getRaw = async (owner: string, key: string): Promise<PointerEntry | null> => {
    try {
      const raw = await datastore.get(pointerKey(owner, key));
      return JSON.parse(new TextDecoder().decode(raw)) as PointerEntry;
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes("NotFound")) {
        return null;
      }
      throw e;
    }
  };

  const write = async (owner: string, entry: PointerEntry): Promise<void> => {
    await datastore.put(
      pointerKey(owner, entry.key),
      new TextEncoder().encode(JSON.stringify(entry)),
    );
  };

  /**
   * Create or overwrite a pointer. Returns true when the pointer already
   * existed (overwritten), false when newly created.
   */
  const setPointer = async (owner: string, key: string, value: string) => {
    return lock.withLock(`${owner}/${key}`, async () => {
      const existing = await getRaw(owner, key);
      await write(owner, { key, value });
      return existing != null;
    });
  };

  /**
   * Atomic compare-and-swap. Only writes when the current value equals
   * `expected`. Returns { updated, current }: updated is false (and current
   * is the actual value) when there was a mismatch.
   */
  const compareAndSetPointer = async (
    owner: string,
    key: string,
    expected: string,
    value: string,
  ) => {
    return lock.withLock(`${owner}/${key}`, async () => {
      const existing = await getRaw(owner, key);
      const current = existing?.value;
      if (current !== expected) {
        return { updated: false, current: current ?? null };
      }
      await write(owner, { key, value });
      return { updated: true, current: value };
    });
  };

  const getPointer = async (
    owner: string,
    key: string,
  ): Promise<PointerEntry | null> => {
    return getRaw(owner, key);
  };

  const deletePointer = async (owner: string, key: string): Promise<boolean> => {
    return lock.withLock(`${owner}/${key}`, async () => {
      const existing = await getRaw(owner, key);
      if (!existing) return false;
      await datastore.delete(pointerKey(owner, key));
      return true;
    });
  };

  const listPointers = async (owner: string): Promise<PointerEntry[]> => {
    const entries: PointerEntry[] = [];
    for await (const key of datastore.queryKeys({
      prefix: `/${PREFIX}/${owner}/`,
    })) {
      const raw = await datastore.get(key);
      if (raw != null) {
        entries.push(JSON.parse(new TextDecoder().decode(raw)) as PointerEntry);
      }
    }
    return entries;
  };

  return {
    setPointer,
    compareAndSetPointer,
    getPointer,
    deletePointer,
    listPointers,
  };
};

export type StoragePointerStore = ReturnType<typeof createStoragePointerStore>;