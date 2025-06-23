import { JSONTreeViewer } from "@/app/components/json-tree-viewer";
import { Button } from "@/app/components/ui/button";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const id = params.id;

  if (!id) {
    throw new Response("Worker ID is required", { status: 400 });
  }

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
    <div className="px-6">
      <div className="flex gap-3">
        <Form method="post">
          <Button type="submit" name="intent" value="kick">
            Kick
          </Button>
          <Button type="submit" name="intent" value="ban">
            Ban
          </Button>
          <Button type="submit" name="intent" value="revoke">
            Revoke Access Code
          </Button>
        </Form>
      </div>

      <h2>Worker State</h2>
      <JSONTreeViewer data={worker.state}></JSONTreeViewer>
    </div>
  );
}

export const action = async ({
  request,
  context,
  params,
}: LoaderFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const id = params.id;

  if (!id) {
    throw new Response("Worker ID is required", { status: 400 });
  }

  if (intent === "kick") {
    context.workerManager.workerQueue.removePeer(id);
  } else if (intent === "ban") {
    await context.workerManager.updateWorkerState(id, (state) => ({
      banned: true,
    }));
    context.workerManager.workerQueue.removePeer(id);
  } else if (intent === "revoke") {
    await context.workerManager.updateWorkerState(id, (state) => ({
      accessCodeRedeemed: undefined,
    }));

    context.workerManager.workerQueue.removePeer(id);
  }

  return null;
};
