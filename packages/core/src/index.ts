import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
export { peerIdFromString } from '@libp2p/peer-id'
import { createLibp2p, type Libp2p } from "libp2p";
import { multiaddr, type Multiaddr } from '@multiformats/multiaddr';
import { webRTC } from "@libp2p/webrtc";

export type { Stream, Connection } from '@libp2p/interface'
export {createLibp2p} from 'libp2p'
export {webRTC} from '@libp2p/webrtc'
export { WebRTC } from '@multiformats/multiaddr-matcher'
export {webSockets} from '@libp2p/websockets'
export {noise} from '@chainsafe/libp2p-noise'
export {yamux} from '@chainsafe/libp2p-yamux'
export {circuitRelayTransport, circuitRelayServer} from '@libp2p/circuit-relay-v2'
export {identify} from '@libp2p/identify'
export {multiaddr, type Multiaddr} from '@multiformats/multiaddr'
export * as filters from '@libp2p/websockets/filters'
export {type Libp2p} from 'libp2p'

import { EventEmitter } from 'events'

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
    id: string
    template: string,
    data: Record<string, any>
}

export type TaskFlowMessage = {
    d: Record<string, any>,
    t: 'task-accepted' | 'task-completed' | 'task-rejected' | 'task'
}

export class Libp2pNode<LocalState> extends EventEmitter{
    public node?: Libp2p;

    public state: LocalState = {} as LocalState;

    constructor(state: LocalState) {
        super();
        this.state = state;
    }

  setState(newState: Record<string, any>) {
    // Merge newState into the existing state
    this.state = { ...this.state, ...newState };
    // Emit the updated state
    this.emit('state:updated', this.state);
  }

    // creates a nodes and starts it
    async start() {
        this.node = await createNode({})
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
}: {}): Promise<Libp2p> {
    // have the node autoconnect to signalling server: // /ip4/127.0.0.1/tcp/24642/ws/p2p-webrtc-star/
    return await createLibp2p({
        addresses: {
            listen: [
            ]
        },
        transports: [
            webRTC(),
        ],
        connectionEncrypters: [
            noise()
        ],
        streamMuxers: [
            yamux()
        ],
    });
}

export const preRenderTask = async (template: string, placeholders: Record<string, any>): Promise<string> => {
    return template.replace(/{{(.*?)}}/g, (_, match) => placeholders[match]);
}

// TODO:: discover an array of worker nodes
export const discoverWorkerNodes = async (): Promise<Multiaddr[]> => {
    return [
        multiaddr('/ip4/127.0.0.1/tcp/40591/ws/p2p/12D3KooWQBPqBN8qmbzpN5kYttT1brE1z1K98yXzxdsot77TcxWo/p2p-circuit/webrtc/p2p/12D3KooWCd9ooEpmsgZLWwAqQmZruecVsFLDvdAiQZSETLzR1x8B')
    ];
}

export class Task {
    id: string;
    template: string;
    data: Record<string, any>;

    static fromPayload(data: TaskPayload) {
        return new Task(data.id, data.template, data.data);
    }

    constructor(id: string, template: string, data: Record<string, any>) {
        this.id = id;
        this.template = template;
        this.data = data;
    }

    compile() {
        return preRenderTask(this.template, this.data);
    }
}