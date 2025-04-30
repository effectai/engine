import { Entity, Transport } from "../entity/factory.js";

export interface HttpTransportOptions {
  port?: number;
}

export interface HttpTransportMethods {
  get(route: string, handler: HttpHandler): Promise<void>;
  post(route: string, handler: HttpHandler): Promise<void>;
  startHttp(): Promise<void>;
  stopHttp(): Promise<void>;
}

export type HttpHandler = (req: any, res: any) => Promise<void> | void;

export class HttpTransport implements Transport<HttpTransportMethods> {
  private entity: Entity | null = null;
  #app: any = null;
  #server: any = null;

  constructor(private readonly options: HttpTransportOptions = {}) {}

  async initialize(entity: Entity): Promise<void> {
    this.entity = entity;
    // Set up the HTTP server

    //dynamic import express
    const express = await import("express");
    const cors = await import("cors");

    this.#app = express.default();
    this.#app.use(cors.default()); // 👈 add this line

    this.#app.use(express.default.json());

    return Promise.resolve();
  }

  async stop(): Promise<void> {
    if (this.#server) {
      await new Promise((resolve) => {
        this.#server.close(resolve);
      });
      this.#server = null;
    }
  }

  async start(): Promise<void> {
    this.#server = this.#app.listen(this.options.port, () => {});
  }

  getMethods(): HttpTransportMethods {
    return {
      get: this.get.bind(this),
      post: this.post.bind(this),
      startHttp: this.start.bind(this),
      stopHttp: this.stop.bind(this),
    };
  }

  async send(data: Uint8Array): Promise<void> {}

  async get(route: string, handler: HttpHandler): Promise<void> {
    this.#app.get(route, async (req: any, res: any) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  async post(route: string, handler: HttpHandler): Promise<void> {
    this.#app.post(route, async (req: any, res: any) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error("Error handling request:", error);
        res.status(500).send("Internal Server Error");
      }
    });
  }
}
