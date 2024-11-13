import {
	type Task,
	type PeerId,
	TypedEventEmitter,
	type PeerStore,
	type ConnectionManager,
	type Registrar,
	type TaskMessage,
    Uint8ArrayList,
    type BatchMessage,
    type Batch
} from "@effectai/task-core";

export interface ProviderServiceComponents {
	registrar: Registrar;
	peerStore: PeerStore;
	connectionManager: ConnectionManager;
}

export interface ProviderServiceEvents {
	"batch:accepted": Batch;
	"batch:results": Batch;
}

export class ProviderService extends TypedEventEmitter<ProviderServiceEvents> {
	private components: ProviderServiceComponents;

	constructor(components: ProviderServiceComponents) {
		super();

		this.components = components;
		this._initialize();
	}

	private _initialize() {
		console.log("Initializing provider service..");
		// handle incoming task messages from the manager
		this.components.registrar.handle(
			"/effect-ai/batch/1.0.0",
			async (streamData) => {
				const data = new Uint8ArrayList();

				for await (const chunk of streamData.stream.source) {
					data.append(chunk);
				}

				const rawMessage = new TextDecoder().decode(data.subarray());
				let message: BatchMessage;

				try {
					message = JSON.parse(rawMessage) as BatchMessage;
				} catch (e) {
					console.error("Error parsing message from manager", e);
					return;
				}

				this._processMessage(message);
			},
			{ runOnLimitedConnection: false },
		);
	}

	private _processMessage(message: BatchMessage) {
		switch (message.t) {
			case "batch":
                // handle batch message
                 break;
			case "status":
				// handle status message
				break;
			case "error":
				//TODO:: handle error message
				break;
			case "result":
				//TODO:: handle result message
				break;
			default:
				console.warn("Unknown message type:", message.t);
		}
	}

    private _sendMessage(message: TaskMessage, peerId: PeerId) {
        
    }
}

export function providerService(
	// init: Partial<TaskManagerInit> = {}
): (components: ProviderServiceComponents) => ProviderService {
	return (components: ProviderServiceComponents) => new ProviderService(components);
}
