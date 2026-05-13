export type CheckType = "clarity" | "clickability" | "compare";

export type Screen =
  | "home"
  | "configure"
  | "submitting"
  | "results"
  | "history";

export type TaskStatus = "pending" | "complete";

export interface TaskContext {
  designPurpose: string;
  targetAudience: string;
  mainGoal: string;
}

export interface WorkerFeedback {
  rating: string;
  insight?: string;
}

export interface ClarityResults {
  kind: "clarity";
  score: number;
  feedback: WorkerFeedback[];
}

export interface ClickabilityResults {
  kind: "clickability";
  stopScrollPercent: number;
  feedback: WorkerFeedback[];
}

export interface CompareResults {
  kind: "compare";
  winner: "A" | "B";
  dimensionsWon: number;
  dimensionsTotal: number;
  feedback: WorkerFeedback[];
}

export type CheckResults =
  | ClarityResults
  | ClickabilityResults
  | CompareResults;

export interface TaskRecord {
  taskId: string;
  canvaId?: string;
  checkType: CheckType;
  status: TaskStatus;
  submittedAt: string;
  workerCount: number;
  context: TaskContext;
  imageUrl?: string;
  imageUrlA?: string;
  imageUrlB?: string;
  versionLabelA?: string;
  versionLabelB?: string;
  revealDuration?: number;
  results?: CheckResults;
}

export interface TaskDraft {
  checkType: CheckType;
  context: TaskContext;
  workerCount: number;
  imageUrl?: string;
  imageUrlA?: string;
  imageUrlB?: string;
  versionLabelA?: string;
  versionLabelB?: string;
  pageA?: number;
  pageB?: number;
  revealDuration?: number;
}

export interface CheckTypeMeta {
  id: CheckType;
  name: string;
  description: string;
}

export const CHECK_TYPES: CheckTypeMeta[] = [
  {
    id: "clarity",
    name: "Clarity Check",
    description: "Will people understand this design quickly?",
  },
  {
    id: "clickability",
    name: "Clickability Check",
    description: "Would people stop scrolling or click?",
  },
  {
    id: "compare",
    name: "Compare Versions",
    description: "Which version works best?",
  },
];

export const REVEAL_DURATION_OPTIONS = [2, 3, 5, 7] as const;
export const PAGE_COUNT_OPTIONS = 5;
