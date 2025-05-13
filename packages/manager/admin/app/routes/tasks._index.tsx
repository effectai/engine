import { json, type MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { TasksTable } from "~/components/tasks/tasks-table";
import type { ManagerContext, ManagerTaskRecord } from "@effectai/manager";
import { serializeBigInts } from "~/utils/serialize";
import { useLoaderData } from "@remix-run/react";
import { TableFilter } from "~/components/table-filter";

export const loader = async ({ context }: { context: ManagerContext }) => {
  const activeTasks = await context.taskManager.getActiveTasks();
  const completedTasks = await context.taskManager.getCompletedTasks();

  return json({
    activeTasks: serializeBigInts(activeTasks),
    completedTasks: serializeBigInts(completedTasks),
  });
};

export default function TasksPage() {
  const { activeTasks, completedTasks } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState("active");

  const filteredTasks = filter === "active" ? activeTasks : completedTasks;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground">View and manage your tasks here.</p>
      <TableFilter
        filters={[
          { key: "active", total: activeTasks.length },
          {
            key: "completed",
            total: completedTasks.length,
          },
        ]}
        setFilter={setFilter}
      />
      <div className="flex flex-col gap-4">
        <TasksTable tasks={filteredTasks} index={filter} />
      </div>
    </div>
  );
}
