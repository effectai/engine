export interface WorkerState {
  peerId: string;
  recipient: string;
  nonce: bigint;
  lastPayout: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksAccepted: number;
  tasksRejected: number;
  lastActivity: number;
  banned: boolean;
}

export interface Task {
  id: string;
  title: string;
  reward: bigint;
  timeLimitSeconds: number;
  templateId: string;
  templateData: string;
}