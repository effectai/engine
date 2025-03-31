import type {
	IncomingStreamData,
	Libp2pEvents,
	PeerId,
	TypedEventTarget,
} from "@libp2p/interface";
import { type MessageStream, pbStream } from "it-protobuf-stream";
import { EffectProtocolMessage } from "../common/proto/effect.js";
import { logger } from "./logging.js";

export type MessageHandler<T, E extends Record<string, CustomEvent>> = {
	handle({
		remotePeer,
		stream,
		events,
		message,
	}: {
		remotePeer: PeerId;
		stream: MessageStream<EffectProtocolMessage>;
		events: TypedEventTarget<E>;
		message: T;
	}): Promise<void>;
};

export interface ActionHandler<T, R> {
	execute(params: T): Promise<R>;
}

export class Router<
	M extends Record<string, MessageHandler<any, any>>,
	A extends Record<string, ActionHandler<any, any>>,
> {
	private messageHandlers = new Map<keyof M, M[keyof M]>();
	private actionHandlers = new Map<keyof A, A[keyof A]>();

	register<K extends keyof M | keyof A>(
		type: "message" | "action",
		key: K,
		handler: K extends keyof M ? M[K] : K extends keyof A ? A[K] : never,
	) {
		if (type === "message") {
			this.messageHandlers.set(key as keyof M, handler as M[keyof M]);
		} else {
			this.actionHandlers.set(key as keyof A, handler as A[keyof A]);
		}
	}

	createActionMethod<T, R>(
		handler: ActionHandler<T, R>,
	): (input: T) => Promise<R> {
		return async (input: T) => handler.execute(input);
	}

	getActions(): {
		[K in keyof A]: (
			input: Parameters<A[K]["execute"]>[0],
		) => ReturnType<A[K]["execute"]>;
	} {
		const actionMethods = {} as {
			[K in keyof A]: (
				input: Parameters<A[K]["execute"]>[0],
			) => ReturnType<A[K]["execute"]>;
		};

		for (const [key, handler] of this.actionHandlers.entries()) {
			actionMethods[key as keyof A] = this.createActionMethod(handler) as (
				input: Parameters<A[typeof key]["execute"]>[0],
			) => ReturnType<A[typeof key]["execute"]>;
		}

		return actionMethods;
	}

	/**
	 * Handles incoming messages and routes them to the correct message handler.
	 */
	async handleMessage(data: IncomingStreamData) {
		const pb = pbStream(data.stream).pb(EffectProtocolMessage);
		const message = await pb.read();
		const remotePeer = data.connection.remotePeer;

		//TODO:: figure out how to inject this context here.. ?
		//@ts-ignore
		await this.router.route(remotePeer, pb, this.events, message);

		await data.stream.close();
	}

	/**
	 * Routes a message to the appropriate handler.
	 */
	async route(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		events: TypedEventTarget<any>,
		message: Record<string, unknown>,
	) {
		if (!message) {
			console.error("Received empty message");
			return;
		}

		const keys = Object.keys(message);
		logger.debug("Routing message: ", keys);
		for (const key of keys) {
			const handler = this.messageHandlers.get(key as keyof M);
			if (handler) {
				return await handler.handle({
					remotePeer,
					stream,
					events,
					message: message[key],
				});
			}
		}

		console.error("No handler found for:", keys);
	}

	async invokeAction<K extends keyof A>(
		key: K,
		params: Parameters<A[K]["execute"]>[0],
	): Promise<ReturnType<A[K]["execute"]>> {
		const action = this.actionHandlers.get(key);
		if (!action) {
			throw new Error(`No action found for key: ${String(key)}`);
		}
		return action.execute(params);
	}
}
