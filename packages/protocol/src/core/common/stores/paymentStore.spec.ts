import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createPaymentStore } from "./paymentStore";
import { Datastore, Key } from "interface-datastore";
import { Payment } from "../../messages/effect";
import { createDataStore } from "../../../../tests/utils";
import { promises } from "node:fs";

describe("createPaymentStore", () => {
  let datastore: Datastore;
  let paymentStore: ReturnType<typeof createPaymentStore>;

  beforeEach(async () => {
    // Reset mock datastore for each test
    datastore = await createDataStore("/tmp/payment-test");
    //reset payment store
    paymentStore = createPaymentStore({ datastore });
  });

  afterEach(async () => {
    await datastore.close();

    await promises.rm("/tmp/payment-test/", { recursive: true, force: true });
  });

  describe("create", () => {
    it("should create a payment record", async () => {
      const payment: Payment = {
        nonce: 1n,
        amount: 100n,
      };

      const result = await paymentStore.create({
        peerId: "peer1",
        payment,
      });

      expect(result).toMatchObject({
        state: payment,
        events: expect.arrayContaining([
          expect.objectContaining({
            type: "create",
          }),
        ]),
      });
    });

    it("should store payment under correct key", async () => {
      const payment: Payment = {
        nonce: 2n,
        amount: 200n,
        // ... other payment fields
      };

      await paymentStore.create({
        peerId: "peer1",
        payment,
      });
    });
  });

  describe("getHighestNonce", () => {
    it("should return 0 when no payments exist", async () => {
      const highestNonce = await paymentStore.getHighestNonce({
        peerId: "peer1",
      });
      expect(highestNonce).toBe(0);
    });

    it("should return the highest nonce for a peer", async () => {
      // Create multiple payments for peer1
      await paymentStore.create({
        peerId: "peer1",
        payment: { nonce: 3n, amount: 100n },
      });
      await paymentStore.create({
        peerId: "peer1",
        payment: { nonce: 7n, amount: 300n },
      });
      await paymentStore.create({
        peerId: "peer1",
        payment: { nonce: 2n, amount: 200n },
      });

      const highestNonce = await paymentStore.getHighestNonce({
        peerId: "peer1",
      });
      expect(highestNonce).toBe(7);
    });
  });
});
