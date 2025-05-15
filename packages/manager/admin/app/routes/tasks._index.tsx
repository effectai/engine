import { json, type MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { TasksTable } from "~/components/tasks/tasks-table";
import type { ManagerContext, ManagerTaskRecord } from "@effectai/manager";
import { serializeBigInts } from "~/utils/serialize";
import { useLoaderData } from "@remix-run/react";
import { TableFilter } from "~/components/table-filter";
import { Pagination } from "~/components/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTasks = filter === "active" ? activeTasks : completedTasks;

  // Calculate paginated tasks
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground">View and manage your tasks here.</p>
      <TableFilter
        filters={[
          { key: "active", total: activeTasks.length },
          { key: "completed", total: completedTasks.length },
        ]}
        setFilter={setFilter}
      />
      <div className="flex flex-col gap-4">
        <TasksTable tasks={paginatedTasks} index={filter} />
        <Pagination
          totalItems={filteredTasks.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
