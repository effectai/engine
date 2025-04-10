import type { EffectProtocolMessage } from "../messages/effect.js";

export type Protocol = {
  name: string;
  version: string;
  scheme: typeof EffectProtocolMessage;
};

export interface Entity {
  transports: Transport[];
  protocol: Protocol;
}

export interface Transport<TMethods = {}> {
  initialize(entity: Entity): Promise<void>;
  getMethods(): TMethods;
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

export async function createEffectEntity<
  T extends Transport[],
  P extends Protocol,
>(config: {
  transports: [...T];
  protocol: P;
}): Promise<Entity & UnionToIntersection<ExtractMethods<T[number]>>> {
  const entity = {
    transports: [],
    protocol: config.protocol,
  };

  // Initialize all transports
  await Promise.all(config.transports.map((t) => t.initialize(entity)));

  // Initialize transports and merge methods
  for (const transport of config.transports) {
    entity.transports.push(transport);

    // Merge send methods into the entity
    const methods = transport.getMethods();
    Object.assign(entity, methods);
  }

  return entity as Entity & UnionToIntersection<ExtractMethods<T[number]>>;
}
