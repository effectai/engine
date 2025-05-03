import {
  AppLoadContext,
  json,
  LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Link } from "@remix-run/react";

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

  return (
    <div className="">
      <h1 className="text-3xl">Manager Dashboard</h1>

      <p className="my-5">
        This is the manager dashboard for the worker pool. You can view and
        manage tasks and workers from here.
      </p>

      <div className="flex gap-2">
        <Link to="/tasks" className="text-blue-500">
          Tasks
        </Link>
        <Link to="/workers" className="text-blue-500">
          Workers
        </Link>
      </div>
    </div>
  );
}
