import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { webSockets } from "@libp2p/websockets";
import { createLibp2p, type Libp2p } from "libp2p";

export type Batch = {
    // amount of times each task in the batch should be completed (by a different worker)
    repetitions: number
    // percentage of tasks that should be validated by the manager
    validationRate: number
    // the template that should be used to render the task
    template: string
    // the data that should be used to render the task
    data: Array<any>;
}

export type TaskPayload = {
    id:string
    template: string,
    data: Record<string, any>
}

export type TaskFlowMessage = {
    id: string,
    result: string,
    type: 'task-accepted' | 'task-completed'
}

export class Libp2pNode {
    public node?: Libp2p;

    constructor() {}

    // creates a nodes and starts it
    async start(port: number) {
        this.node = await createNode({port})
        await this.node.start();
    }

    async stop() {
        if (!this.node) {
            throw new Error('Node not initialized');
        }
        await this.node.stop();
    }
}

export async function createNode({
    port = 15000
}: {
    port: number
}): Promise<Libp2p> {
    return await createLibp2p({
        transports: [
            webSockets()
        ],
        connectionEncrypters: [
            noise()
        ],
        streamMuxers: [
            yamux()
        ],
        addresses: {
            listen: [
                `/dns4/` + 'localhost' + `/tcp/` + port + `/ws`
            ]
        }
    });
}
