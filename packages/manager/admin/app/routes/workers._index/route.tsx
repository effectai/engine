import { useLoaderData, useSearchParams } from "@remix-run/react";
import { DataTable } from "~/components/data-table";
import { columns } from "./columns";
import type { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const workers = await context.workerManager.all();
  const queue = context.workerManager.workerQueue.getQueue();

  const mappedWorkers = workers.map((worker) => ({
    state: {
      ...worker.state,
      isOnline: queue.includes(worker.state.peerId),
    },
  }));

  return {
    workers: mappedWorkers,
  };
}

export default function Component() {
  const { workers } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
      <DataTable columns={columns} data={workers} />
    </div>
  );
}
