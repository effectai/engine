import { EffectProtocolMessage } from "../../@generated/effect.protons.js";

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

export type EntityWithTransports<T extends Transport[]> = Entity &
  {
    [K in keyof T]: T[K] extends Transport<infer TMethods> ? TMethods : never;
  }[number];

export async function createEffectEntity<
  T extends Transport[],
  P extends Protocol,
>(config: {
  transports: [...T];
  protocol: P;
}): Promise<Entity & UnionToIntersection<ExtractMethods<T[number]>>> {
  const entity = {
    transports: [] as Transport[],
    protocol: config.protocol,
  };

  await Promise.all(config.transports.map((t) => t.initialize(entity)));

  for (const transport of config.transports) {
    entity.transports.push(transport);

    const methods = transport.getMethods();
    Object.assign(entity, methods);
  }

  return entity as Entity & UnionToIntersection<ExtractMethods<T[number]>>;
}
