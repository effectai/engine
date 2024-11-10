import type { TaskPayload } from "../index.js";

export class Task {
	id: string;
	template: string;
	data: Record<string, any>;
	result: string | null = null;

	// override equals method
	equals(other: Task) {
		return this.id === other.id;
	}


	static fromPayload(data: TaskPayload) {
		return new Task(data.id, data.template, data.data);
	}

	constructor(id: string, template: string, data: Record<string, any>) {
		this.id = id;
		this.template = template;
		this.data = data;
	}

	compile() {
		// return preRenderTask(this.template, this.data);
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
