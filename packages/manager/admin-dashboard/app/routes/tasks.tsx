import { type MetaFunction } from "@remix-run/node";
import { mockTasks, mockWorkers } from "~/lib/mock-data";
import { useToast } from "~/hooks/use-toast";
import { WorkersTable } from "~/components/workers/worker-table";
import { useState } from "react";
import { WorkersFilter } from "~/components/workers/workers-filter";
import { TasksTable } from "~/components/tasks/tasks-table";
import { Task } from "@effectai/protocol-core";
import { TasksFilter } from "~/components/tasks/tasks-filter";

// export const loader = async ({ context }: { context: ManagerContext }) => {
//   const onlineWorkers = await context.workerManager.getWorkers(
//     context.workerManager.workerQueue.queue,
//   );
//
//   const activeTasks = await context.taskManager.getActiveTasks();
//   const allWorkers = await context.workerManager.all();
//
//   return json({
//     activeTasks: serializeBigInts(activeTasks),
//     onlineWorkers: serializeBigInts(onlineWorkers),
//     allWorkers: serializeBigInts(allWorkers),
//   });
// };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    // Add more filters as needed
    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground">View and manage your tasks here.</p>
      <TasksFilter filter={filter} setFilter={setFilter} total={tasks.length} />
      <div className="flex flex-col gap-4">
        <TasksTable tasks={filteredTasks} />
      </div>
    </div>
  );
}
