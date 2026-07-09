import { describe, expect, it, vi } from "vitest";
import { runConnectFlow } from "./runConnectFlow";

describe("sync connect flow", () => {
  it("runs sync before requestToWork by default", async () => {
    const calls: string[] = [];

    const syncWithManager = vi.fn(async () => {
      calls.push("sync");
    });

    const requestToWork = vi.fn(async () => {
      calls.push("connect");
      return [{}, null] as const;
    });

    await runConnectFlow({
      autoSyncBeforeConnect: true,
      syncWithManager,
      requestToWork,
    });

    expect(calls).toEqual(["sync", "connect"]);
    expect(syncWithManager).toHaveBeenCalledTimes(1);
    expect(requestToWork).toHaveBeenCalledTimes(1);
  });

  it("skips sync when skipSync is true", async () => {
    const calls: string[] = [];

    const syncWithManager = vi.fn(async () => {
      calls.push("sync");
    });

    const requestToWork = vi.fn(async () => {
      calls.push("connect");
      return [{}, null] as const;
    });

    await runConnectFlow({
      autoSyncBeforeConnect: true,
      skipSync: true,
      syncWithManager,
      requestToWork,
    });

    expect(calls).toEqual(["connect"]);
    expect(syncWithManager).not.toHaveBeenCalled();
    expect(requestToWork).toHaveBeenCalledTimes(1);
  });
});
