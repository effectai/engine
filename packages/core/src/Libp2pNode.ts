import type { Libp2p } from "libp2p";
import { EventEmitter } from "node:events";

export interface NodeEventMap<State> {
	"node:started": Libp2p;
	"state:updated": State;
}

export class Libp2pNode<State, Events extends NodeEventMap<State> = NodeEventMap<State>> extends EventEmitter {
    protected eventMap: Events = {} as Events;
    public node?: Libp2p;

	public state: State = {} as State;

	constructor(state: State) {
		super();
		this.state = state;
	}

	// @ts-ignore
	emit<K extends keyof Events>(
		event: K,
		payload: Events[K],
	): boolean {
		return super.emit(event as string , payload);
	}

	// @ts-ignore
	on<K extends keyof Events>(
		event: K,
		listener: (payload: Events[K]) => void,
	) {
		return super.on(event as string, listener);
	}

	setState(newState: Record<string, any>) {
		// Merge newState into the existing state
		this.state = { ...this.state, ...newState };
		// Emit the updated state
		this.emit("state:updated", this.state);
	}

	// creates a nodes and starts it
	async start() {
		if (!this.node) {
			throw new Error("Node not initialized");
		}

		await this.node.start();
		this.emit("node:started", this.node);
	}

	async stop() {
		if (!this.node) {
			throw new Error("Node not initialized");
		}
		await this.node.stop();
	}
}