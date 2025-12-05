import { JSONTreeViewer } from "@/app/components/json-tree-viewer";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
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
  const [capability, setCapability] = React.useState("");
  const navigation = useNavigation();

  // Clear textbox after form submits
  React.useEffect(() => {
    if (navigation.state === "idle") {
      setCapability("");
    }
  }, [navigation.state]);

  const managerCapability = worker.state.managerCapabilities || [];

  return (
    <div className="px-6">
      <div className="flex gap-3">
        <Form method="post" className="flex gap-2 mb-4">
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

      <h2>Worker State</h2>
      <JSONTreeViewer data={worker.state} className="mb-4"/>

      <h2>Manager Capabilities</h2>

      <Form method="post" className="flex gap-2 mb-3">
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

      <div className="flex gap-2 flex-wrap mb-3">
        {managerCapability.map((cap) => (
          <Form key={cap} method="post" className="inline">
            <input type="hidden" name="capability" value={cap} />
            <input type="hidden" name="intent" value="deleteCapability" />

            <div className="flex items-center gap-1 bg-gray-100 text-black px-3 py-1 rounded select-none">
              {cap}

              <button
                type="submit"
                className="cursor-pointer pl-2 text-red-600 leading-none"
              >
                x
              </button>
            </div>
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
    await context.workerManager.updateWorkerState(id, () => ({ 
      banned: true,
    }));
    context.workerManager.workerQueue.removePeer(id);
  } else if (intent === "unban") {
    await context.workerManager.updateWorkerState(id, () => ({ 
      banned: false,
    }));
  } else if (intent === "revoke") {
    await context.workerManager.updateWorkerState(id, () => ({
      accessCodeRedeemed: undefined,
    }));
    context.workerManager.workerQueue.removePeer(id);
  } else if (intent === "promote") {
    await context.workerManager.updateWorkerState(id, () => ({ 
      isAdmin: true, 
    }));
  } else if (intent === "addCapability") {
    const raw = String(formData.get("capability") ?? "");

    const newCap = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const worker = await context.workerManager.getWorker(id);
    const current = worker?.state.managerCapabilities || [];

    const merged = Array.from(new Set([...current, ...newCap]));

    await context.workerManager.updateWorkerState(id, () => ({
      managerCapabilities: merged,
    }));

  } else if (intent === "deleteCapability") {
    const toRemove = String(formData.get("capability") ?? "");
    const worker = await context.workerManager.getWorker(id);
    const current = worker?.state.managerCapabilities || [];

    const updated = current.filter((c) => c !== toRemove);

    await context.workerManager.updateWorkerState(id, () => ({
      managerCapabilities: updated,
    }));
  }

  return null;
};
