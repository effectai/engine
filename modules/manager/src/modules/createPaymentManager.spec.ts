import { Keypair, PublicKey } from "@solana/web3.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPaymentManager } from "./createPaymentManager.js";

describe("createPaymentManager", () => {
  let mockPrivateKey: any;
  let mockWorkerManager: any;
  let mockPaymentStore: any;
  let mockPeerId: any;
  let mockRecipient: PublicKey;

  beforeEach(() => {
    mockPeerId = {
      toString: () => "12D3KooWMockedPeerID",
    };

    mockRecipient = new Keypair().publicKey;

    mockPaymentStore = {
      create: vi.fn(),
    };

    mockWorkerManager = {
      getWorker: vi.fn().mockResolvedValue({
        state: {
          recipient: mockRecipient.toBase58(),
          nonce: 1n,
        },
      }),
      updateWorkerState: vi.fn(),
      workerQueue: { queue: [mockPeerId.toString()] },
    };

    mockPrivateKey = {
      raw: new Uint8Array(64).fill(1),
    };
  });

  it("generates a signed payment object and stores it", async () => {
    const paymentAccount = new PublicKey("11111111111111111111111111111111");

    const paymentManager = await createPaymentManager({
      workerManager: mockWorkerManager,
      privateKey: mockPrivateKey,
      paymentStore: mockPaymentStore,
      logger: { log: { info: vi.fn(), error: vi.fn() } } as any,
      publicKey: mockRecipient.toBase58(),
      managerSettings: {
        paymentAccount: paymentAccount.toBase58(),
      } as any,
    });

    const result = await paymentManager.generatePayment({
      peerId: mockPeerId,
      amount: 1000n,
      paymentAccount,
    });

    expect(result).toBeDefined();
    expect(mockPaymentStore.create).toHaveBeenCalled();
  });
});
