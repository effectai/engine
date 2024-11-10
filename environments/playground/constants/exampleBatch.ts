import { Batch } from "@effectai/task-core";

export const exampleBatch = new Batch({
	repetitions: 2,
	validationRate: 0.5,
	template: `
		<html>
			<head>
				<style>
					body {
						font-family: Arial, sans-serif;
						background-color: #f0f0f0;
						margin: 0;
						padding: 20px;
					}
					h1 {
						color: #333;
					}
					p {
						font-size: 1rem;
						color: #666;
					}
					input[type="submit"] {
						background-color: #4CAF50;
						color: white;
						padding: 10px 20px;
						border: none;
						border-radius: 4px;
						cursor: pointer;
						font-size: 1rem;
					}
					input[type="submit"]:hover {
						background-color: #45a049;
					}
				</style>
			</head>
			<body>
				<h1>{{title}}</h1>
				<p>{{description}}</p> 
				<input type="submit" value="submit"/> 
			</body>
		</html>
	`,
	data: [
		{
			title: "Task 1",
			description: "This is task 1: press submit to complete this task.",
		},
		// {
		// 	title: "Task 2",
		// 	description: "This is task 2: press submit to complete this task.",
		// },
		// {
		// 	title: "Task 3",
		// 	description: "This is task 3: press submit to complete this task.",
		// },
		// {
		// 	title: "Task 4",
		// 	description: "This is task 4: press submit to complete this task.",
		// },
		// {
		// 	title: "Task 5",
		// 	description: "This is task 5: press submit to complete this task.",
		// },
	],
});
