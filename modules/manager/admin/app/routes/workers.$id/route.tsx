import { JSONTreeViewer } from "@/app/components/json-tree-viewer";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import React from "react";

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
  const [capability, setCapability] = React.useState(
    (worker.state.managerCapabilities || []).join(","),
  );

  return (
    <div className="px-6">
      <div className="flex gap-3">
        <Form method="post" className="flex gap-2">
          <Button type="submit" name="intent" value="kick">
            Kick
          </Button>
          <Button type="submit" name="intent" value="ban">
            Ban
          </Button>
          <Button type="submit" name="intent" value="unban">
            Unban
          </Button>
          <Button type="submit" name="intent" value="revoke">
            Revoke Access Code
          </Button>
          <Button type="submit" name="intent" value="promote">
            Promote to Admin
          </Button>
        </Form>
      </div>
      <br></br>
      <h2>Worker State</h2>
      <JSONTreeViewer data={worker.state}></JSONTreeViewer>

      <br></br>

      <h2>Manager Capabilities</h2>

      <br></br>

      <Form method="post" className="flex gap-2">
        <Input
          name="capability"
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
          placeholder="capability1, capability2, capability3"
        />

        <Button type="submit" name="intent" value="addCapability">
          Add Capability
        </Button>
      </Form>
      
      <br></br>

      <div className="flex flex-col gap-2">
        {worker.state.managerCapabilities.map((cap, i) => (
          <Form method="post" key={i} className="flex items-center gap-2">
            <input type="hidden" name="capability" value={cap} />
            <span>{cap}</span>
            <Button type="submit" name="intent" value="removeCapability" variant="destructive">
              Remove
            </Button>
          </Form>
        ))}
      </div>
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
  } else if (intent === "unban") {
    await context.workerManager.updateWorkerState(id, (state) => ({
      banned: false,
    }));
  } else if (intent === "revoke") {
    await context.workerManager.updateWorkerState(id, (state) => ({
      accessCodeRedeemed: undefined,
    }));

    context.workerManager.workerQueue.removePeer(id);
  } else if (intent === "promote") {
    await context.workerManager.updateWorkerState(id, (state) => ({
      isAdmin: true,
    }));
  } else if (intent === "addCapability") {
    const raw = String(formData.get("capability") ?? "");
    const parsed = Array.from(
      new Set(
        raw
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      ),
    );

    if (parsed.length === 0) {
      console.warn("No capabilities provided; skipping update.");
      return null;
    }

    console.log("Updating capabilities to:", parsed);

    await context.workerManager.updateWorkerState(id, (state: any) => ({
      managerCapabilities: Array.from(
        new Set([...(state.managerCapabilities || []), ...parsed]),
      ),
    }));
  } else if (intent === "removeCapability") {
    const capabilityToRemove = String(formData.get("capability") ?? "");

    await context.workerManager.updateWorkerState(id, (state: any) => ({
      managerCapabilities: (state.managerCapabilities || []).filter(
        (cap: string) => cap !== capabilityToRemove
      ),
    }));
  }

  return null;
};
