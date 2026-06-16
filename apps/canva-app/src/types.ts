import { defineMessage } from "react-intl";
import type { MessageDescriptor } from "react-intl";

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
  name: MessageDescriptor;
  description: MessageDescriptor;
}

export const CHECK_TYPES: CheckTypeMeta[] = [
  {
    id: "clarity",
    name: defineMessage({
      defaultMessage: "Clarity Check",
      description: "Name of the clarity check type",
    }),
    description: defineMessage({
      defaultMessage: "Will people understand this design quickly?",
      description: "Description of the clarity check type",
    }),
  },
  {
    id: "clickability",
    name: defineMessage({
      defaultMessage: "Clickability Check",
      description: "Name of the clickability check type",
    }),
    description: defineMessage({
      defaultMessage: "Would people stop scrolling or click?",
      description: "Description of the clickability check type",
    }),
  },
  {
    id: "compare",
    name: defineMessage({
      defaultMessage: "Compare Versions",
      description: "Name of the compare versions check type",
    }),
    description: defineMessage({
      defaultMessage: "Which version works best?",
      description: "Description of the compare versions check type",
    }),
  },
];

export const COMPARE_VERSION_TONES = {
  A: "info",
  B: "warn",
} as const;

export const CLICKABILITY_TONES = {
  yes: "positive",
  no: "critical",
} as const;

export const REVEAL_DURATION_OPTIONS = [2, 3, 5, 7] as const;

export interface SelectOption {
  id: string;
  label: MessageDescriptor;
}

export const DESIGN_PURPOSE_OPTIONS: SelectOption[] = [
  { id: "Facebook / Instagram ad", label: defineMessage({ defaultMessage: "Facebook / Instagram ad", description: "Design purpose option" }) },
  { id: "Event flyer", label: defineMessage({ defaultMessage: "Event flyer", description: "Design purpose option" }) },
  { id: "Product landing page", label: defineMessage({ defaultMessage: "Product landing page", description: "Design purpose option" }) },
  { id: "Email newsletter", label: defineMessage({ defaultMessage: "Email newsletter", description: "Design purpose option" }) },
  { id: "Presentation", label: defineMessage({ defaultMessage: "Presentation", description: "Design purpose option" }) },
  { id: "Poster", label: defineMessage({ defaultMessage: "Poster", description: "Design purpose option" }) },
  { id: "Social media post", label: defineMessage({ defaultMessage: "Social media post", description: "Design purpose option" }) },
  { id: "Business card", label: defineMessage({ defaultMessage: "Business card", description: "Design purpose option" }) },
];

export const TARGET_AUDIENCE_OPTIONS: SelectOption[] = [
  { id: "Small business owners", label: defineMessage({ defaultMessage: "Small business owners", description: "Target audience option" }) },
  { id: "Fitness enthusiasts", label: defineMessage({ defaultMessage: "Fitness enthusiasts", description: "Target audience option" }) },
  { id: "Young adults (18-25)", label: defineMessage({ defaultMessage: "Young adults (18–25)", description: "Target audience option" }) },
  { id: "Professionals / B2B", label: defineMessage({ defaultMessage: "Professionals / B2B", description: "Target audience option" }) },
  { id: "Parents", label: defineMessage({ defaultMessage: "Parents", description: "Target audience option" }) },
  { id: "Students", label: defineMessage({ defaultMessage: "Students", description: "Target audience option" }) },
  { id: "General public", label: defineMessage({ defaultMessage: "General public", description: "Target audience option" }) },
];

export const MAIN_GOAL_OPTIONS: SelectOption[] = [
  { id: "Drive sales", label: defineMessage({ defaultMessage: "Drive sales", description: "Main goal option" }) },
  { id: "Generate leads", label: defineMessage({ defaultMessage: "Generate leads", description: "Main goal option" }) },
  { id: "Build brand awareness", label: defineMessage({ defaultMessage: "Build brand awareness", description: "Main goal option" }) },
  { id: "Promote an event", label: defineMessage({ defaultMessage: "Promote an event", description: "Main goal option" }) },
  { id: "Drive website traffic", label: defineMessage({ defaultMessage: "Drive website traffic", description: "Main goal option" }) },
  { id: "Increase engagement", label: defineMessage({ defaultMessage: "Increase engagement", description: "Main goal option" }) },
  { id: "Educate / inform", label: defineMessage({ defaultMessage: "Educate / inform", description: "Main goal option" }) },
];
