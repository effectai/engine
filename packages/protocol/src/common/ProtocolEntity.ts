import { type Startable, TypedEventEmitter } from "@libp2p/interface";
import { type MessageHandler, Router } from "./router.js";

export class ProtocolEntity<
		MessageHandlerMap extends Record<string, MessageHandler<unknown, any>>,
		ActionsMap extends Record<string, any>,
		ProtocolEvents extends Record<string, CustomEvent>,
	>
	extends TypedEventEmitter<ProtocolEvents>
	implements Startable
{
	private _actions?: {
		[key in keyof ActionsMap]: (
			params: Parameters<ActionsMap[key]["execute"]>[0],
		) => Promise<ReturnType<ActionsMap[key]["execute"]>>;
	};

	public get actions() {
		if (!this._actions) {
			throw new Error("Actions are not available before start()");
		}

		return this._actions;
	}

	constructor(
		protected router: Router<MessageHandlerMap, ActionsMap> = new Router(),
	) {
		super();
	}

	start(): void | Promise<void> {}

	afterStart(): void | Promise<void> {
		this._actions = this.router.getActions();
	}

	stop(): void | Promise<void> {}
}
