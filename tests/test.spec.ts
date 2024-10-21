import { expect, test, it, beforeAll, afterAll, describe } from "bun:test";

import { Libp2p } from 'packages/nodes/core';

import { connectToWorker, createManagerNode } from "../packages/nodes/manager";
import { createWorkerNode, getMultiAddr } from "../packages/nodes/worker";

describe("P2P Network Communication Test", async () => {
    let managerNode: Libp2p;
    let workerNode: Libp2p;

    beforeAll(async () => {
        managerNode = await createManagerNode();
        workerNode = await createWorkerNode();
        
        await managerNode.start();
        await workerNode.start();
    });

    afterAll(async () => {
        // await managerNode.stop();
        // await workerNode.stop();
    });

    it("should connect to worker node", async () => {
        // // get the worker address
        // console.log(workerNode.peerId.toString());

        // const workerAddress = getMultiAddr(workerNode.peerId.toString());
        // await connectToWorker(managerNode, workerAddress);
    })

});