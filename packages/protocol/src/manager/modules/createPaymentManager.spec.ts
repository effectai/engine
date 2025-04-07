import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPaymentManager } from "./createPaymentManager";
import { PublicKey } from "@solana/web3.js";
import { PeerId } from "@libp2p/interface";

import { getNonce, getRecipient } from "../utils.js";
import { signPayment } from "../../utils/payment.js";

vi.mock("../utils.js");
vi.mock("../../utils/payment.js");

describe("createPaymentManager", () => {
	let mockPeerStore: any;
	let mockPrivateKey: any;
	let mockPeerId: PeerId;
	let peerData: any;

	beforeEach(() => {
		mockPeerId = {
			toString: () => "12D3KooWMockedPeerID",
		} as PeerId;

		peerData = {
			metadata: new Map(),
		};

		mockPeerStore = {
			get: vi.fn().mockResolvedValue(peerData),
		};

		mockPrivateKey = {
			raw: new Uint8Array(64).fill(1),
		};

		vi.mocked(getNonce).mockReturnValue(5n);
		vi.mocked(getRecipient).mockReturnValue("RecipientPubKeyMocked");
		vi.mocked(signPayment).mockResolvedValue({
			S: 123n,
			R8: [new Uint8Array([1, 2]), new Uint8Array([3, 4])],
		});
	});

	it("generates a signed payment object", async () => {
		const paymentManager = createPaymentManager({
			privateKey: mockPrivateKey,
			paymentStore: {},
			peerStore: mockPeerStore,
		});

		const paymentAccount = new PublicKey("11111111111111111111111111111111");

		const result = await paymentManager.generatePayment({
			peerId: mockPeerId,
			amount: 1000n,
			paymentAccount,
		});

		expect(result.amount).toBe(1000n);
		expect(result.recipient).toBe("RecipientPubKeyMocked");
		expect(result.paymentAccount).toBe(paymentAccount.toBase58());
		expect(result.nonce).toBe(5n);

		expect(result.signature).toEqual({
			S: "123",
			R8: {
				R8_1: new Uint8Array([1, 2]),
				R8_2: new Uint8Array([3, 4]),
			},
		});
		expect(mockPeerStore.get).toHaveBeenCalledWith(mockPeerId);
		expect(getNonce).toHaveBeenCalled();
		expect(getRecipient).toHaveBeenCalled();
		expect(signPayment).toHaveBeenCalled();
	});
});
