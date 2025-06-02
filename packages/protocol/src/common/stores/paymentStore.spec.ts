import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { createPaymentStore } from "./paymentStore";
import { Datastore, Key } from "interface-datastore";
import { promises } from "node:fs";
import { createDataStore } from "@effectai/test-utils";
import { Payment } from "../../../@generated/effect.protons";
import { ulid } from "ulid";

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
        id: ulid(),
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
        id: ulid(),
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
    it("should return undefined when no payments exist", async () => {
      const highestNonce = await paymentStore.getHighestNonce({
        peerId: "peer1",
      });
      expect(highestNonce).toBe(0n);
    });

    it("should return the highest nonce for a peer", async () => {
      // Create multiple payments for peer1
      await paymentStore.create({
        id: ulid(),
        peerId: "peer1",
        payment: { id: ulid(), nonce: 3n, amount: 100n },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await paymentStore.create({
        id: ulid(),
        peerId: "peer1",
        payment: { id: ulid(), nonce: 7n, amount: 300n },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await paymentStore.create({
        id: ulid(),
        peerId: "peer1",
        payment: { id: ulid(), nonce: 2n, amount: 200n },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      await paymentStore.create({
        id: ulid(),
        peerId: "peer1",
        payment: { id: ulid(), nonce: 16n, amount: 200n },
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const highestNonce = await paymentStore.getHighestNonce({
        peerId: "peer1",
      });

      expect(highestNonce).toBe(16n);
    });

    describe("getFrom", () => {
      it("fetches the correct payment records", async () => {
        for (let i = 0; i < 25; i += 4) {
          await paymentStore.create({
            peerId: "peer1",
            payment: { id: ulid(), nonce: BigInt(i), amount: BigInt(i) },
          });
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        const payments = await paymentStore.getFrom({
          peerId: "peer1",
          nonce: 13,
        });

        expect(payments).toHaveLength(3);
      });

      describe("paginated payments", () => {
        it("should return paginated payments", async () => {
          const n = 10;

          for (let i = 0; i < n; i++) {
            await paymentStore.create({
              peerId: "peer1",
              payment: { id: ulid(), nonce: i, amount: BigInt(i) },
            });

            await new Promise((resolve) => setTimeout(resolve, 10));
          }

          const result = await paymentStore.getPaginatedPayments({
            perPage: 50,
            page: 1,
          });

          expect(result.items).toHaveLength(n);
        });
      });
    });
  });
});
