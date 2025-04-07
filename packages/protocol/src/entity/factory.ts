import type { Datastore } from "interface-datastore";
import type {
	Entity,
	ExtractMethods,
	Transport,
	UnionToIntersection,
} from "../core/types.js";
import type { EntityWithTransports } from "./types.js";
import type { StoreInitializers, StoreMap } from "../stores/base.js";

export async function createEffectEntity<T extends Transport[]>(config: {
	transports: [...T];
	datastore: Datastore;
}): Promise<Entity & UnionToIntersection<ExtractMethods<T[number]>>> {
	const entity: Entity = {
		transports: [],
		context: {
			datastore: config.datastore,
		},
	};

	// Initialize transports and merge methods
	for (const transport of config.transports) {
		entity.transports.push(transport);

		// Merge send methods into the entity
		const methods = transport.getMethods();
		Object.assign(entity, methods);
	}

	// Initialize all transports
	await Promise.all(config.transports.map((t) => t.initialize(entity)));

	return entity as Entity & UnionToIntersection<ExtractMethods<T[number]>>;
}
