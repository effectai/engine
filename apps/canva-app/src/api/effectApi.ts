import { auth } from "@canva/user";
import type {
  CheckResults,
  CheckType,
  TaskContext,
  TaskRecord,
} from "../types";

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

// Stable, language-independent identifiers for a failed request. Canva only
// translates strings that live in the frontend bundle, so the UI must map one
// of these codes to a localized message (see apiErrorMessage) rather than show
// any string the backend returned. See:
// https://www.canva.dev/docs/apps/localization/backend-responses/
const API_ERROR_CODES = [
  "unauthorized",
  "rate_limited",
  "not_found",
  "server_error",
  "network_error",
  "unknown",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

function isApiErrorCode(value: string): value is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(value);
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(code: ApiErrorCode, status?: number) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

// A 404 on a specific task is its own type so the results poller can tell
// "this task was deleted" apart from other failures and show a tailored,
// already-localized message instead of the generic one.
export class TaskNotFoundError extends ApiError {
  readonly taskId: string;

  constructor(taskId: string) {
    super("not_found", 404);
    this.name = "TaskNotFoundError";
    this.taskId = taskId;
  }
}

export function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "unknown";
}

// Prefer a machine-readable `code` from the backend body; otherwise derive a
// stable code from the HTTP status. The backend's human-readable `error` string
// is deliberately ignored so a non-localized string can never reach the UI.
async function apiErrorFromResponse(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { code?: unknown } | null;
  const code =
    body && typeof body.code === "string" && isApiErrorCode(body.code)
      ? body.code
      : codeFromStatus(res.status);
  return new ApiError(code, res.status);
}

type ApiRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = await auth.getCanvaUserToken();
    return { "X-Canva-User-Token": token };
  } catch {
    return {};
  }
}

async function apiFetch(
  path: string,
  init: ApiRequestInit = {},
): Promise<Response> {
  try {
    return await fetch(`${BACKEND_HOST}${path}`, {
      method: init.method,
      headers: { ...init.headers, ...(await authHeaders()) },
      body: init.body,
    });
  } catch {
    // fetch only rejects on network-level failures (offline, DNS, blocked CORS).
    throw new ApiError("network_error");
  }
}

export async function submitTask(
  payload: TaskPayload,
): Promise<{ taskId: string }> {
  const res = await apiFetch("/api/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
  return res.json();
}

export async function getTaskStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  const res = await apiFetch(`/api/task/${taskId}`);
  if (res.status === 404) {
    throw new TaskNotFoundError(taskId);
  }
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
  return res.json();
}

export async function deleteTask(taskId: string): Promise<void> {
  const res = await apiFetch(`/api/task/${taskId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw await apiErrorFromResponse(res);
  }
}

export async function getTasks(): Promise<TaskRecord[]> {
  const res = await apiFetch("/api/tasks");
  if (!res.ok) {
    throw await apiErrorFromResponse(res);
  }
  return res.json();
}
