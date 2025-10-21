import { Keypair, PublicKey } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentManager } from "./createPaymentManager.js";

import { signPayment } from "../utils.js";
import { ulid } from "ulid";

describe("createPaymentManager", () => {
  let mockPeerStore: any;
  let mockPrivateKey: any;
  let mockWorkerManager: any;
  let mockPaymentStore: any;
  let mockPeerId: PeerId;
  let peerData: any;
  let mockRecipient: PublicKey;

  vi.mock(import("../utils.js"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      computePaymentId: vi.fn(),
    };
  });

  beforeEach(() => {
    mockPeerId = {
      toString: () => "12D3KooWMockedPeerID",
    } as PeerId;

    mockRecipient = new Keypair().publicKey;

    peerData = {
      metadata: new Map(),
    };

    mockPeerStore = {
      get: vi.fn().mockResolvedValue(peerData),
    };

    mockPaymentStore = {
      all: vi.fn(),
      has: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    };

    mockWorkerManager = {
      getWorker: vi.fn().mockResolvedValue({
        state: {
          peerId: mockPeerId,
          nonce: 5n,
        },
      }),
      selectWorker: vi.fn(() => mockPeerId),
      updateWorkerState: vi.fn(),
    };

    mockPrivateKey = {
      raw: new Uint8Array(64).fill(1),
    };

    vi.mocked(mockWorkerManager.getWorker).mockResolvedValue({
      state: {
        recipient: "GGqak36ECpZP5HbZse41bynygPR2ciYsTVPsriocqjWH",
        nonce: 1n,
      },
    });
  });

  it("generates a signed payment object", async () => {
    const paymentManager = await createPaymentManager({
      workerManager: mockWorkerManager,
      privateKey: mockPrivateKey,
      paymentStore: mockPaymentStore,
    });

    const paymentAccount = new PublicKey("11111111111111111111111111111111");

    const result = await paymentManager.generatePayment({
      id: ulid(),
      peerId: mockPeerId,
      amount: 1000n,
      paymentAccount,
    });

    // expect(result.amount).toBe(1000n);
    // expect(result.paymentAccount).toBe(paymentAccount.toBase58());
    // expect(result.nonce).toBe(5n);
  });

  it(
    "batches proof",
    async () => {
      const paymentAccount = new PublicKey(
        "6XjpcA3N18t2ToVndtySfUXU2pKtDca2NZCFbygh7f56",
      );

      const paymentManager = await createPaymentManager({
        workerManager: mockWorkerManager,
        privateKey: mockPrivateKey,
        paymentStore: mockPaymentStore,
        managerSettings: {
          paymentAccount: paymentAccount.toBase58(),
        },
      });

      const proofsToGenerate = 2;
      const paymentsPerProof = 10;

      const proofs = [];
      //generate 2 proofs
      for (let p = 0; p < proofsToGenerate; p++) {
        const payments = [];
        //generate 10 payments
        for (let i = 0; i < paymentsPerProof; i++) {
          vi.mocked(mockWorkerManager.getWorker).mockResolvedValue({
            state: {
              recipient: "GGqak36ECpZP5HbZse41bynygPR2ciYsTVPsriocqjWH",
              nonce: BigInt(paymentsPerProof * p + i),
            },
          });

          const result = await paymentManager.generatePayment({
            peerId: mockPeerId,
            amount: 1000n,
            paymentAccount,
          });

          payments.push(result);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const { proof, publicSignals, pubKey } =
          await paymentManager.generatePaymentProof(mockPrivateKey, payments);

        proofs.push({
          pubKey,
          proof,
          publicSignals,
        });
      }

      //batch the proofs
      const batchedProof = await paymentManager.bulkPaymentProofs({
        privateKey: mockPrivateKey,
        recipient: mockRecipient,
        r8_x: proofs[0].pubKey[0],
        r8_y: proofs[0].pubKey[1],
        proofs,
      });

      expect(batchedProof).toBeDefined();
      expect(batchedProof.proof).toBeDefined();

      //expect first public signal to be 0
      expect(batchedProof.publicSignals).toBeDefined();
      expect(batchedProof.publicSignals![0]).toBe("0");
      expect(batchedProof.publicSignals![1]).toBe(
        (proofsToGenerate * paymentsPerProof - 1).toString(),
      );
    },
    { timeout: 240_000 },
  );
});
