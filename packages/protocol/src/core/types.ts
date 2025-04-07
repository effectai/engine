import { Datastore } from "interface-datastore";

export interface Transport<TMethods = {}> {
	initialize(entity: Entity): Promise<void>;
	getMethods(): TMethods;
}

export interface EntityContext {
	datastore: Datastore;
}

export interface Entity {
	transports: Transport[];
	context: EntityContext;
}

export type UnionToIntersection<U> = (
	U extends any
		? (k: U) => void
		: never
) extends (k: infer I) => void
	? I
	: never;

export type ExtractMethods<T> = T extends Transport<infer TMethods>
	? TMethods
	: never;
