import { describe, expect, it, vi } from "vitest";
import { runCatchUpSync } from "./runCatchUpSync";

describe("sync catch-up flow", () => {
  it("keeps paging tasks and payments until both are drained", async () => {
    const syncPage = vi
      .fn()
      .mockResolvedValueOnce({
        workerId: "worker-1",
        managerPeerId: "manager-1",
        serverTime: 100,
        cursor: 100n,
        capabilities: ["model/gpt5"],
        tasks: [{ taskId: "task-1", status: "assigned", lastEventAt: 1 }],
        payments: [{ paymentId: "payment-1", status: "created", amount: "1", createdAt: 1 }],
        tasksCursor: "0000000001:task-1",
        paymentsCursor: "0000000001:payment-1",
        tasksHasMore: true,
        paymentsHasMore: true,
      })
      .mockResolvedValueOnce({
        workerId: "worker-1",
        managerPeerId: "manager-1",
        serverTime: 101,
        cursor: 101n,
        capabilities: [],
        tasks: [{ taskId: "task-2", status: "accepted", lastEventAt: 2 }],
        payments: [],
        tasksCursor: "0000000002:task-2",
        paymentsCursor: "0000000001:payment-1",
        tasksHasMore: false,
        paymentsHasMore: false,
      });

    const result = await runCatchUpSync({
      scopes: ["status", "capabilities", "tasks", "payments"],
      limit: 1,
      syncPage,
    });

    expect(syncPage).toHaveBeenCalledTimes(2);
    expect(syncPage.mock.calls[0][0]).toMatchObject({
      scopes: ["status", "capabilities", "tasks", "payments"],
      limit: 1,
    });
    expect(syncPage.mock.calls[1][0]).toMatchObject({
      scopes: ["tasks", "payments"],
      tasksCursor: "0000000001:task-1",
      paymentsCursor: "0000000001:payment-1",
      limit: 1,
    });
    expect(result?.tasksCursor).toBe("0000000002:task-2");
  });
});
