import type { IncomingStreamData, PeerId } from "@libp2p/interface";
import { type MessageStream, pbStream } from "it-protobuf-stream";
import { EffectProtocolMessage } from "../proto/effect.js";
import { logger } from "./logging.js";

export interface MessageHandler<T> {
	handle(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
		message: T,
	): Promise<void>;
}

export interface ActionHandler<T, R> {
	execute(params: T): Promise<R>;
}

export class Router<
	M extends Record<string, MessageHandler<any>>,
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

	getActions<A extends ActionsMap>(): {
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
			// This assumes that handler has an `execute` method that fits the types.
			actionMethods[key as keyof A] = async (
				input: Parameters<A[typeof key]["execute"]>[0],
			) => handler.execute(input);
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

		await this.router.route(remotePeer, pb, message);

		await data.stream.close();
	}

	/**
	 * Routes a message to the appropriate handler.
	 */
	async route(
		remotePeer: PeerId,
		stream: MessageStream<EffectProtocolMessage>,
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
				await handler.handle(remotePeer, stream, message[key]);
				return;
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
