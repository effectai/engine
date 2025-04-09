import {
  EffectProtocolMessage,
  Payment,
  ProofResponse,
  Template,
} from "../messages/effect.js";
import { Task } from "./proto/effect.js";

export interface BaseTaskEvent {
  timestamp: number;
  type: string;
}

export interface TaskRecord<EventType extends BaseTaskEvent = BaseTaskEvent> {
  state: Task;
  events: EventType[];
}

export type TenantType = "manager" | "worker";

type AckResponse = EffectProtocolMessage["ack"];

export type ResponseMap = {
  task: AckResponse;
  taskAccepted: AckResponse;
  taskRejected: AckResponse;
  taskCompleted: AckResponse;
  payment: AckResponse;
  payoutRequest: Payment;
  proofRequest: ProofResponse;
  proofResponse: never;
  template: never;
  templateRequest: Template;
};

// Helper type to extract response type
export type MessageResponse<T extends EffectProtocolMessage> = {
  [K in keyof T]: K extends keyof ResponseMap
    ? T[K] extends undefined
      ? never
      : ResponseMap[K]
    : never;
}[keyof T];
