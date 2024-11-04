import { nanoid } from "nanoid";
import { Task } from "../task/task.js";

export class Batch {
	repetitions: number;
	validationRate: number;
	template: string;
	taskData: Array<Record<string, any>>;

	constructor({
		repetitions,
		validationRate,
		template,
		data,
	}: {
		repetitions: number;
		validationRate: number;
		template: string;
		data: Array<Record<string, any>>;
	}) {
		this.repetitions = repetitions;
		this.validationRate = validationRate;
		this.template = template;
		this.taskData = data;
	}

	extractTasks(): Task[] {
		return this.taskData.map((data) => {
			const id = nanoid();
			return new Task(id, this.template, data);
		});
	}
}
