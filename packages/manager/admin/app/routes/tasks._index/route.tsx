import { useLoaderData, useSearchParams } from "@remix-run/react";
import { DataTable } from "~/components/data-table";
import { columns } from "./../tasks/columns";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const tasks = await context.taskManager.getActiveTasks();

  return {
    tasks,
  };
}

export default function Component() {
  const { tasks } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
      <DataTable columns={columns} data={tasks} />
    </div>
  );
}
