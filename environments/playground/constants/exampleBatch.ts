import { Batch } from "@effectai/task-core";

export const exampleBatch = new Batch({
	repetitions: 2,
	validationRate: 0.5,
	template:
		'<html><body><h1>{{title}}</h1><p>{{description}}</p> <input type="submit" value="submit"/> </body></html>',
	data: [
		{
			title: "Task 1",
			description: "This is task 1",
		},
		{
			title: "Task 2",
			description: "This is task 2",
		},
	],
});
