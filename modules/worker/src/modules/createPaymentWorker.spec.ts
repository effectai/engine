import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentWorker } from "./createPaymentWorker";
import { createPaymentStore } from "@effectai/protocol-core";
import { ulid } from "ulid";
import { promises } from "node:fs";
import { createDataStore } from "@effectai/test-utils";
import type { Payment } from "@effectai/protobufs";

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
      const payment: Payment = {
        id: ulid(),
        version: 1,
        nonce: BigInt(i),
        amount: 100n,
        recipient: "recipient-test",
        paymentAccount: "payment-account-test",
        publicKey: "manager-public-key",
        signature: {
          R8: {
            R8_1: "1",
            R8_2: "2",
          },
          S: "3",
        },
      };

      await paymentWorker.createPayment({
        managerPeerId: "peer-testing-1",
        payment,
      });
    }

    const result = await paymentWorker.getPaginatedPayments({
      page: 1,
      perPage: 10,
    });

    expect(result.items.length).toBeGreaterThan(0);
  });
});
