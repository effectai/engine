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
  const { peerId } = params;

  if (!peerId) {
    throw new Response("Peer ID is required", { status: 400 });
  }

  const worker = await context.workerManager.getWorker(peerId);

  return json({
    ...serializeBigInts(worker),
  });
};

export default function TasksPage() {
  const { state, events } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-3xl">Worker Details</h1>

      <h2 className="text-2xl mt-5">Worker State</h2>
      <JSONTreeViewer data={state} expandLevel={2} />

      <h2>Worker Events</h2>
      <JSONTreeViewer data={events} expandLevel={2} />
      <h2>Worker Actions</h2>
      <div className="flex gap-2">
        <Button variant="outline">Ban</Button>
      </div>
    </div>
  );
}
