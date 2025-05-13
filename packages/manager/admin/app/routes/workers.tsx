import { json, type MetaFunction } from "@remix-run/node";

import { useLoaderData } from "@remix-run/react";
import { serializeBigInts } from "~/utils/serialize";

import { WorkersTable } from "~/components/workers/worker-table";

import { useState } from "react";
import { TableFilter } from "~/components/table-filter";
import type { ManagerContext } from "@effectai/manager";

export const loader = async ({ context }: { context: ManagerContext }) => {
  const onlineWorkers = await context.workerManager.getWorkers(
    context.workerManager.workerQueue.queue,
  );

  const allWorkers = await context.workerManager.all();

  return json({
    onlineWorkers: serializeBigInts(onlineWorkers),
    allWorkers: serializeBigInts(allWorkers),
  });
};

export default function App() {
  const [filter, setFilter] = useState("all");
  const { allWorkers, onlineWorkers } = useLoaderData<typeof loader>();

  const filteredWorkers = filter === "active" ? onlineWorkers : allWorkers;
  console.log("workers", filteredWorkers);

  return (
    <div>
      <TableFilter
        filters={[
          { key: "online", total: onlineWorkers.length },
          {
            key: "all",
            total: allWorkers.length,
          },
        ]}
        setFilter={setFilter}
      />
      <WorkersTable
        workers={filteredWorkers}
        onBan={() => {}}
        onUnban={() => {}}
      />
    </div>
  );
}
