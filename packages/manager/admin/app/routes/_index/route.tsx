import StatCardList from "@/app/components/stat-card-list";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardTitle } from "@/app/components/ui/card";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const activeTasks = await context.taskManager.getActiveTasks();
  const completedTasks = await context.taskManager.getPaginatedTasks({
    perPage: 1,
    page: 0,
    prefix: "tasks/completed",
  });
  const totalTasks = completedTasks.total + activeTasks.length;
  const workerQueue = context.workerManager.workerQueue.queue;
  const workers = await context.workerManager.all();
  const cycle = context.getCycle();
  const totalAmount = workers.reduce(
    (acc, worker) => acc + (worker.state?.totalEarned ?? 0n),
    0n,
  );

  const stats = [
    {
      title: "Total Tasks",
      value: totalTasks,
    },
    {
      title: "Active Workers",
      value: workerQueue.length,
    },
    {
      title: "Completed Tasks",
      value: completedTasks.total,
    },
    {
      title: "Active Tasks",
      value: activeTasks.length,
    },
    {
      title: "Current Cycle",
      value: cycle,
    },
    {
      title: "Paid Out",
      value: (totalAmount / BigInt(1e6)).toString(),
    },
  ];

  return {
    stats,
  };
}

export default function Component() {
  const { stats } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="px-6">
        <Card className="my-5">
          <CardContent className="my-5 flex gap-3">
            <Button>Pause</Button>
          </CardContent>
        </Card>
      </div>
      <StatCardList stats={stats} />
    </div>
  );
}

export const action = async ({ request, context }: LoaderFunctionArgs) => {};
