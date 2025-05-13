import { JSONTreeViewer } from "~/components/json-tree-viewer";
import { Button } from "./../components/ui/button";
import { json, useLoaderData } from "@remix-run/react";
import { serializeBigInts } from "~/utils/serialize";
import type { ManagerContext } from "@effectai/manager";
import { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({
  context,
  params,
}: LoaderFunctionArgs & { context: ManagerContext }) => {
  const { taskId, index } = params;

  if (!taskId) {
    throw new Response("Task ID is required", { status: 400 });
  }

  const task = await context.taskManager.getTask({
    taskId,
    index,
  });

  return json({
    ...serializeBigInts(task),
  });
};

export default function TasksPage() {
  const { state, events } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl">Task Details</h1>
      <div>Current Status : {events[events.length - 1]?.type}</div>

      <h2 className="text-2xl mt-5">Task State</h2>
      <JSONTreeViewer data={state} expandLevel={2} />
      <h2>Task Events</h2>
      <JSONTreeViewer data={events} expandLevel={2} />
      <h2>Task Actions</h2>
      <div className="flex gap-2">
        <Button variant="outline">Invalidate</Button>
      </div>
    </div>
  );
}
