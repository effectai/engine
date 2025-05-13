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

export class EffectProtocolError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProtocolError";
  }
}
