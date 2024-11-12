import { nanoid } from "nanoid";
import { Task } from "../task/task.js";


export class Batch {
	repetitions: number;
	validationRate: number;
	template: string;
	taskData: Array<Record<string, any>>;
	mode: "predefined" | "streaming";

	constructor({
		repetitions,
		validationRate,
		template,
		data,
		mode = "predefined",
	}: {
		repetitions: number;
		validationRate: number;
		template: string;
		data: Array<Record<string, any>>;
		mode?: "predefined" | "streaming";
	}) {
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

	extractTasks(): Task[] {
		return this.taskData.map((data) => {
			const id = nanoid();
			return new Task(id, this.template, data);
		});
	}
}
