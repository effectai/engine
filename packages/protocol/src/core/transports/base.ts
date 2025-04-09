import type { Entity } from "../types.js";

export abstract class BaseTransport<TMethods>
  implements BaseTransport<TMethods> {
  protected entity?: Entity;

  async initialize(entity: Entity) {
    this.entity = entity;
    await this.setup();
  }

  abstract setup(): Promise<void>;

  abstract get getMethods(): TMethods;
}
