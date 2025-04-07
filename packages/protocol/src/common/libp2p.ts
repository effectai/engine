import { createLibp2pTransport } from "../transports/libp2p.js";
import { EffectProtocolMessage } from "./proto/effect.js";
import { session } from "./SessionService.js";

export type CreateEffectLibp2pTransportOptions = {
	getData: () => any;
	listen: string[];
};

export const createEffectLibp2pTransport = ({
	getData,
	listen,
}: CreateEffectLibp2pTransportOptions) => {
	const protocol = {
		name: "/effectai/1.0.0",
		scheme: EffectProtocolMessage,
	};

	createLibp2pTransport({
		listen,
		services: {
			session: session({
				getData: () => ({}),
			}),
		},
	});
};
