import { JSONTreeViewer } from "@/app/components/json-tree-viewer";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const id = params.id;

  if (!id) {
    throw new Response("Task ID is required", { status: 400 });
  }

  const task = await context.taskManager.getTask({ taskId: id });

  return {
    task,
  };
}

export default function Component() {
  const { task } = useLoaderData<typeof loader>();

  return (
    <div>
      <h2>Task State</h2>
      <JSONTreeViewer data={task.state}></JSONTreeViewer>
    </div>
  );
}
