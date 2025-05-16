import { json, type MetaFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { TasksTable } from "~/components/tasks/tasks-table";
import type { ManagerContext, ManagerTaskRecord } from "@effectai/manager";
import { serializeBigInts } from "~/utils/serialize";
import { useLoaderData } from "@remix-run/react";
import { TableFilter } from "~/components/table-filter";
import { Pagination } from "~/components/pagination";

export const loader = async ({
  context,
  request,
}: {
  context: ManagerContext;
  request: Request;
}) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = parseInt(url.searchParams.get("perPage") || "10");
  const filter = url.searchParams.get("filter") || "active";

  const result = await context.taskManager.getPaginatedTasks(
    filter as "active" | "completed",
    page,
    perPage,
  );

  return json({
    tasks: serializeBigInts(result.items),
    filter,
    pagination: {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious,
    },
  });
};

export default function TasksPage() {
  const { tasks, pagination, filter } = useLoaderData<typeof loader>();
  const [currentPage, setCurrentPage] = useState(pagination.page);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Tasks</h1>
      <p className="text-muted-foreground">View and manage your tasks here.</p>
      <TableFilter
        filters={[
          { key: "active", total: pagination.total },
          { key: "completed", total: pagination.total },
        ]}
        currentFilter={filter}
      />
      <div className="flex flex-col gap-4">
        <TasksTable tasks={tasks} index={filter} />
        <Pagination
          totalItems={pagination.total}
          currentPage={pagination.page}
          itemsPerPage={pagination.perPage}
          queryParam="page"
        />
      </div>
    </div>
  );
}
