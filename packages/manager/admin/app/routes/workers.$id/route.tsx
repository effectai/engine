import { JSONTreeViewer } from "@/app/components/json-tree-viewer";
import { Button } from "@/app/components/ui/button";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const id = params.id;
  const worker = await context.workerManager.getWorker(id);

  if (!worker) {
    throw new Response("Worker not found", { status: 404 });
  }

  return {
    worker,
  };
}

export default function Component() {
  const { worker } = useLoaderData<typeof loader>();

  return (
    <div class="px-6">
      <div>
        <Button>Ban</Button>
        <Button>Kick</Button>
      </div>

      <h2>Worker State</h2>
      <JSONTreeViewer data={worker.state}></JSONTreeViewer>
    </div>
  );
}
