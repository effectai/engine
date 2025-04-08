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
