import { beforeEach, describe, expect, it } from "vitest";
import { createWorkerQueue } from "./createWorkerQueue.js";
import type { PeerId } from "@libp2p/interface";
import { peerIdFromString } from "@libp2p/peer-id";

describe("createWorkerQueue", () => {
	let peerId1: PeerId;
	let peerId2: PeerId;

	beforeEach(async () => {
		peerId1 = peerIdFromString(
			"12D3KooWR3aZ9bLgTjsyUNqC8oZp5tf3HRmqb9G5wNpEAKiUjVv5",
		);
		peerId2 = peerIdFromString(
			"12D3KooWCGYNj72ZrtiXG8MUvSEmEUZUvq1Uksz2JGBqAQofmGk2",
		);
	});

	it("adds a worker to the queue", () => {
		const queue = createWorkerQueue();
		queue.addWorker(peerId1);

		expect(queue.getWorkerQueue()).toEqual([peerId1.toString()]);
	});

	it("can add multiple workers and get them in order", () => {
		const queue = createWorkerQueue();

		queue.addWorker(peerId1);
		queue.addWorker(peerId2);

		expect(queue.getWorkerQueue()).toEqual([
			peerId1.toString(),
			peerId2.toString(),
		]);
	});

	it("dequeues workers in FIFO order", () => {
		const queue = createWorkerQueue();
		queue.addWorker(peerId1);
		queue.addWorker(peerId2);

		const firstOut = queue.dequeueWorker();
		expect(firstOut).toBe(peerId1.toString());

		const secondOut = queue.dequeueWorker();
		expect(secondOut).toBe(peerId2.toString());
	});

	it("returns undefined when dequeuing from an empty queue", () => {
		const queue = createWorkerQueue();
		expect(queue.dequeueWorker()).toBeUndefined();
	});
});
