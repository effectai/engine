export enum TaskStatus {
	PENDING = "pending",
	ACCEPTED = "accepted",
	COMPLETED = "completed",
	REJECTED = "rejected",
}

export type TaskMessage =
  | { t: "task"; id: string; d: TaskData }
  | { t: "status"; id: string; d: TaskStatus }
  | { t: "error"; id: string; d: { message: string } }
  | { t: "result"; id: string; d: { result: any } };

export type TaskData = {
	template: string;
	[key: string]: any;
} 

export class Task {
	id: string;
	template: string;
	data: Record<string, any>;
	result: string | null = null;

	constructor(id: string, template: string, data: Record<string, any>) {
		this.id = id;
		this.template = template;
		this.data = data;
	}
	// override equals method
	equals(other: Task) {
		return this.id === other.id;
	}

	static fromMessage(task: TaskMessage) {
		if(task.t !== "task") {
			throw new Error("Invalid message type");
		}

		return new Task(task.id, task.d.template, task.d);
	}

	static toMessage(task: Task) {
		return {
			t: "task",
			id: task.id,
			timestamp: Date.now(),
			d: task.data
		};
	}

	toJSON() {
		return {
			id: this.id,
			template: this.template,
			data: this.data,
			result: this.result,
		};
	}
}
