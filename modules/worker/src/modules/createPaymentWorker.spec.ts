import { beforeEach, describe, it, test, vi } from "vitest";
import { createPaymentWorker } from "./createPaymentWorker";
import { createPaymentStore } from "@effectai/protocol-core";
import { ulid } from "ulid";
import { promises } from "node:fs";

describe("createPaymentWorker", async () => {
  let paymentWorker: ReturnType<typeof createPaymentWorker>;

  beforeEach(async () => {
    const path = "/tmp/test/payment-worker/";
    await promises.rm(path, { recursive: true, force: true });

    const manager = {
      sendMessage: vi.fn().mockResolvedValue([null, null]),
    };

    const mockEventEmitter = {
      safeDispatchEvent: vi.fn(),
    };

    const datastore = await createDataStore("/tmp/test/payment-worker");
    const paymentStore = createPaymentStore({
      datastore,
    });

    paymentWorker = createPaymentWorker({
      paymentStore,
      manager,
      events: mockEventEmitter,
    });
  });

  it("tests worker payments", async () => {
    const n = 50;
    for (let i = 0; i < n; i++) {
      console.log(i);
      await paymentWorker.createPayment({
        managerPeerId: "peer-testing-1",
        payment: {
          id: ulid(),
          nonce: BigInt(i),
        },
      });
    }

    const result = await paymentWorker.getPaginatedPayments({
      page: 1,
      perPage: 10,
    });

    result.items.map((item) => {
      console.log(item.state);
    });
  });
});
