import {
  AppLoadContext,
  json,
  LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";

import type { ManagerContext } from "@effectai/protocol";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { serializeBigInts } from "~/utils/serialize";
import WorkerView from "~/components/WorkerView";
import { TaskView } from "~/components/TaskView";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader = async ({ context }: { context: ManagerContext }) => {
  const workers = await context.workerManager.getWorkers(
    context.workerManager.workerQueue.queue,
  );

  const activeTasks = await context.taskManager.getActiveTasks();

  return json({
    activeTasks: serializeBigInts(activeTasks),
    workers: serializeBigInts(workers),
  });
};

export default function App() {
  const { workers, activeTasks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleBan = (peerId: string) => {
    fetcher.submit({ peerId }, { method: "post", action: "/api/ban-worker" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      <WorkerView workers={workers} onBan={handleBan} />
      <TaskView tasks={activeTasks} />
    </div>
  );
}
