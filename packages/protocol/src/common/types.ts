import type {
  EffectIdentifyResponse,
  EffectProtocolMessage,
  Payment,
  ProofResponse,
  RequestToWorkResponse,
  Task,
  Template,
} from "@effectai/protobufs";

export interface BaseTaskEvent {
  timestamp: number;
  type: string;
}

export interface TaskRecord<EventType extends BaseTaskEvent = BaseTaskEvent> {
  state: Task;
  events: EventType[];
}

type AckResponse = EffectProtocolMessage["ack"];

export type ResponseMap = {
  [K in keyof EffectProtocolMessage]: K extends "task"
    ? AckResponse
    : K extends "taskAccepted"
      ? AckResponse
      : K extends "taskRejected"
        ? AckResponse
        : K extends "taskCompleted"
          ? AckResponse
          : K extends "payment"
            ? AckResponse
            : K extends "payoutRequest"
              ? Payment
              : K extends "proofRequest"
                ? ProofResponse
                : K extends "proofResponse"
                  ? never
                  : K extends "templateRequest"
                    ? Template
                    : K extends "templateResponse"
                      ? never
                      : K extends "error"
                        ? never
                        : K extends "bulkProofRequest"
                          ? ProofResponse
                          : K extends "ack"
                            ? never
                            : K extends "requestToWork"
                              ? RequestToWorkResponse
                              : K extends "identifyRequest"
                                ? EffectIdentifyResponse
                                : never;
};

export type MessageResponse<T extends EffectProtocolMessage> = {
  [K in keyof T]: K extends keyof ResponseMap
    ? T[K] extends undefined
      ? never
      : ResponseMap[K]
    : never;
}[keyof T];
