import { auth } from "@canva/user";
import type { CheckResults, CheckType, TaskContext, TaskRecord } from "../types";

export interface TaskPayload {
  checkType: CheckType;
  context: TaskContext;
  workerCount: number;
  imageUrl?: string;
  imageUrlA?: string;
  imageUrlB?: string;
  versionLabelA?: string;
  versionLabelB?: string;
  revealDuration?: number;
}

export interface TaskStatusResponse {
  status: "pending" | "complete";
  completions: number;
  workerCount: number;
  results?: CheckResults;
}

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task ${taskId} not found`);
    this.name = "TaskNotFoundError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = await auth.getCanvaUserToken();
    return { "X-Canva-User-Token": token };
  } catch {
    return {};
  }
}

export async function submitTask(
  payload: TaskPayload,
): Promise<{ taskId: string }> {
  const res = await fetch(`${BACKEND_HOST}/api/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function getTaskStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  const res = await fetch(`${BACKEND_HOST}/api/task/${taskId}`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) {
    throw new TaskNotFoundError(taskId);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await fetch(`${BACKEND_HOST}/api/task/${taskId}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
}

export async function getTasks(): Promise<TaskRecord[]> {
  const res = await fetch(`${BACKEND_HOST}/api/tasks`, {
    headers: await authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
