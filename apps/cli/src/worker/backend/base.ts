import type { Task } from "@effectai/protocol";

// TODO: Replace with the TaskResult type from the Effect SDK once it is exposed.
export type TaskResult = unknown;

export interface AutomationBackend {
  id: string;
  isReady(): boolean;
  init(): Promise<void>;
  execute(task: Task, template?: string): Promise<TaskResult>;
  cleanup?(): Promise<void>;
}
