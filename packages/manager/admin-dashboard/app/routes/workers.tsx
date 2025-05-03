import {
  AppLoadContext,
  json,
  LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { mockWorkers } from "~/lib/mock-data";
import { useToast } from "~/hooks/use-toast";

import type { ManagerContext } from "@effectai/protocol";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { serializeBigInts } from "~/utils/serialize";

import { WorkersTable } from "~/components/workers/worker-table";

import { useState } from "react";
import { WorkersFilter } from "~/components/workers/workers-filter";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

//
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

export default function App() {
  const [workers, setWorkers] = useState(mockWorkers);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  // const { activeTasks, allWorkers, onlineWorkers } =
  //   useLoaderData<typeof loader>();
  // const fetcher = useFetcher();
  //
  // const handleBan = (peerId: string) => {
  //   fetcher.submit(
  //     { peerId },
  //     { method: "post", action: "/actions/ban-worker" },
  //   );
  // };
  //
  const filteredWorkers = workers.filter((worker) => {
    if (filter === "all") return true;
    if (filter === "active")
      return !worker.banned && Date.now() - worker.lastActivity < 3600000;
    if (filter === "banned") return worker.banned;
    if (filter === "inactive")
      return Date.now() - worker.lastActivity >= 3600000;
    return true;
  });

  return (
    <div>
      <WorkersFilter
        filter={filter}
        setFilter={setFilter}
        total={workers.length}
        active={
          workers.filter(
            (w) => !w.banned && Date.now() - w.lastActivity < 3600000,
          ).length
        }
        banned={workers.filter((w) => w.banned).length}
        inactive={
          workers.filter((w) => Date.now() - w.lastActivity >= 3600000).length
        }
      />
      <WorkersTable
        workers={filteredWorkers}
        onBan={() => {}}
        onUnban={() => {}}
      />
    </div>
  );
}
