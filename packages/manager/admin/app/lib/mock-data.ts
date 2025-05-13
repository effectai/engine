import type { ManagerTaskRecord } from "@effectai/manager";

export const mockWorkers: WorkerState[] = Array.from({ length: 10 }, (_, i) => {
  const now = Date.now();
  const totalTasks = Math.floor(Math.random() * 100) + 5;
  const tasksCompleted = Math.floor(Math.random() * totalTasks);
  const tasksRejected = Math.floor(
    Math.random() * (totalTasks - tasksCompleted),
  );
  const tasksAccepted = totalTasks - tasksRejected;

  return {
    peerId: `peer-${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 10)}`,
    recipient: `0x${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
    nonce: BigInt(Math.floor(Math.random() * 1000)),
    lastPayout:
      i % 3 === 0
        ? now - 1000 * 60 * 60 * 24 * Math.floor(Math.random() * 10)
        : 0,
    totalTasks,
    tasksCompleted,
    tasksAccepted,
    tasksRejected,
    lastActivity: now - 1000 * 60 * (i % 4 === 0 ? 120 : i * 10),
    banned: i % 7 === 0,
  };
});

export const mockTasks: ManagerTaskRecord[] = Array.from(
  { length: 15 },
  (_, i) => {
    const taskTypes = [
      "Image Processing",
      "Data Analysis",
      "Video Transcoding",
      "Neural Network Training",
      "Text Classification",
    ];

    return {
      events: [
        {
          type: "create",
          providerPeer: "peer-234",
          timestamp: new Date().getTime() / 1000,
        },
        {
          type: "accept",
          acceptedByPeer: "peer-1234",
          timestamp: new Date().getTime() / 1000,
        },
      ],
      state: {
        id: `task-${Math.random().toString(36).substring(2, 9)}`,
        title: `${taskTypes[i % taskTypes.length]} Task ${i + 1}`,
        reward: BigInt(Math.floor(Math.random() * 150_000_000) + 1000000),
        timeLimitSeconds: Math.floor(Math.random() * 10800) + 1800,
        templateId: `template-${Math.random().toString(36).substring(2, 10)}`,
        templateData: JSON.stringify(
          {
            parameters: {
              complexity: Math.floor(Math.random() * 5) + 1,
              priority: Math.floor(Math.random() * 3) + 1,
            },
          },
          null,
          2,
        ),
      },
    };
  },
);
