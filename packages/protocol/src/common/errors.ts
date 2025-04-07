export class TaskExpiredError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TaskExpiredError";
	}
}

export class TaskNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TaskNotFound";
	}
}

export class TaskValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TaskValidationError";
	}
}
