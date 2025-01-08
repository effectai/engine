import { nanoid } from "nanoid";
import { Task } from "../task/task.js";

export interface BatchMessage {
	t: "batch" | "status" | "error" | "result"; // Message type
	id: string; // Unique batch ID
	timestamp: number; // Timestamp for the message
	d: any; // Task data (could use a more specific type here)
}

export class Batch {
	id: string = nanoid();
	repetitions: number;
	validationRate: number;
	template: string;
	taskData: Array<Record<string, any>>;
	mode: "predefined" | "streaming";

	constructor({
		id,
		repetitions,
		validationRate,
		template,
		data,
		mode = "predefined",
	}: {
		id: string;
		repetitions: number;
		validationRate: number;
		template: string;
		data: Array<Record<string, any>>;
		mode?: "predefined" | "streaming";
	}) {

		if(id){
			this.id = id;
		}

		this.repetitions = repetitions;
		this.validationRate = validationRate;
		this.template = template;
		this.taskData = data;
		this.mode = mode;
	}

	toJSON() {
		return {
			repetitions: this.repetitions,
			validationRate: this.validationRate,
			template: this.template,
			data: this.taskData,
			mode: this.mode,
		};
	}

	static fromMessage(batch: BatchMessage) {
		if(batch.t !== "batch") {
			throw new Error("Invalid message type");
		}

		return new Batch({
			id: batch.id,
			repetitions: batch.d.repetitions,
			validationRate: batch.d.validationRate,
			template: batch.d.template,
			data: batch.d.data,
		});
	}

	extractTasks(): Task[] {
		return this.taskData.map((data) => {
			const id = nanoid();
			return new Task(id, this.template, data);
		});
	}
}
