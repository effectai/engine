import { JSONTreeViewer } from "@/app/components/json-tree-viewer";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  formatBytes,
  formatCount,
  formatEffect,
  formatTimestamp,
  getSuccessRate,
  toDate,
} from "@/app/lib/utils";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { createHash } from "node:crypto";
import { availableCapabilities } from "@effectai/capabilities";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const id = params.id;

  if (!id) {
    throw new Response("Worker ID is required", { status: 400 });
  }

  const worker = await context.workerManager.getWorker(id);

  if (!worker) {
    throw new Response("Worker not found", { status: 404 });
  }

  // Fetch per-worker storage quota
  const ownerHex = createHash("sha256").update(worker.state.peerId).digest("hex");
  const quota = await context.storageManager.getQuota(ownerHex);

  return {
    worker,
    quota,
  };
}

function StateField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium break-all">{children}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const CUSTOM_CAPABILITY_OPTION = "__custom__";

const relativeHint = (unixSeconds: number | undefined | null) =>
  unixSeconds
    ? formatDistanceToNow(toDate(unixSeconds), { addSuffix: true })
    : undefined;

export default function Component() {
  const { worker, quota } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [capability, setCapability] = React.useState("");
  const [customCapability, setCustomCapability] = React.useState("");
  const navigation = useNavigation();

  const [discordName, setDiscordName] = React.useState(
    worker.state.discordName ?? "",
  );

  React.useEffect(() => {
    setDiscordName(worker.state.discordName ?? "");
  }, [worker.state.discordName]);

  // Clear the capability inputs after form submits
  React.useEffect(() => {
    if (navigation.state === "idle") {
      setCapability("");
      setCustomCapability("");
    }
  }, [navigation.state]);

  const managerCapability = worker.state.managerCapabilities || [];
  const successRate = getSuccessRate(worker.state);

  const grantableCapabilities = availableCapabilities.filter(
    (entry) => !managerCapability.includes(entry.id),
  );

  const isCustomCapability = capability === CUSTOM_CAPABILITY_OPTION;
  const capabilityToAdd = isCustomCapability
    ? customCapability.trim()
    : capability;

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

      <h2>Discord</h2>
      <Form method="post" className="flex gap-2 mb-4 max-w-md">
        <Input
          name="discordName"
          value={discordName}
          onChange={(event) => setDiscordName(event.target.value)}
          placeholder="Discord username"
        />
        <Button type="submit" name="intent" value="setDiscordName">
          Save
        </Button>
      </Form>

      {actionData?.savedDiscordName !== undefined && (
        <p className="-mt-2 mb-4 text-sm text-green-600">
          {actionData.savedDiscordName
            ? `Saved Discord name "${actionData.savedDiscordName}".`
            : "Discord name cleared."}
        </p>
      )}

      <h2>Worker State</h2>
      <div className="my-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StateField label="Peer ID">
          <span className="font-mono text-xs">{worker.state.peerId}</span>
        </StateField>

        <StateField label="Recipient">
          <span className="font-mono text-xs">{worker.state.recipient}</span>
        </StateField>

        <StateField label="Status">
          <div className="flex flex-wrap gap-2">
            <Badge variant={worker.state.banned ? "purple" : "green"}>
              {worker.state.banned ? "Banned" : "Active"}
            </Badge>
            {worker.state.isAdmin && <Badge variant="default">Admin</Badge>}
          </div>
        </StateField>

        <StateField
          label="Total Earned"
          hint={`${worker.state.totalEarned.toString()} raw units`}
        >
          {formatEffect(BigInt(worker.state.totalEarned ?? 0n))} EFFECT
        </StateField>

        <StateField
          label="Last Payout"
          hint={relativeHint(worker.state.lastPayout)}
        >
          {formatTimestamp(worker.state.lastPayout)}
        </StateField>

        <StateField
          label="Last Activity"
          hint={relativeHint(worker.state.lastActivity)}
        >
          {formatTimestamp(worker.state.lastActivity)}
        </StateField>

        <StateField
          label="Success Rate"
          hint={`${formatCount(worker.state.tasksCompleted)} of ${formatCount(
            worker.state.totalTasks,
          )} tasks completed`}
        >
          {successRate === null ? "No tasks yet" : `${successRate.toFixed(1)}%`}
        </StateField>

        <StateField label="Tasks Accepted / Rejected">
          {formatCount(worker.state.tasksAccepted)} /{" "}
          {formatCount(worker.state.tasksRejected)}
        </StateField>

        <StateField label="Nonce">{worker.state.nonce.toString()}</StateField>

        <StateField label="Access Code">
          {worker.state.accessCodeRedeemed ? (
            <span className="font-mono">{worker.state.accessCodeRedeemed}</span>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </StateField>

        <StateField
          label="Storage Used"
          hint={`${formatCount(quota.totalBytes)} bytes`}
        >
          {formatBytes(quota.totalBytes)}
        </StateField>

        <StateField label="Stored Objects">
          {formatCount(quota.objectCount)}
        </StateField>
      </div>

      <details className="mb-4">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          Raw worker state
        </summary>
        <JSONTreeViewer data={worker.state} className="mt-2" />
      </details>

      <h2>Manager Capabilities</h2>

      <Form method="post" className="mb-3 max-w-xl space-y-2">
        <div className="flex gap-2">
          <select
            value={capability}
            onChange={(event) => setCapability(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a capability...</option>
            {grantableCapabilities.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} ({entry.id})
              </option>
            ))}
            <option value={CUSTOM_CAPABILITY_OPTION}>Other...</option>
          </select>

          <Button
            type="submit"
            name="intent"
            value="addCapability"
            disabled={!capabilityToAdd}
          >
            Add Capability
          </Button>
        </div>

        {isCustomCapability && (
          <Input
            autoFocus
            value={customCapability}
            onChange={(event) => setCustomCapability(event.target.value)}
            placeholder="effectai/my-capability:1.0.0"
          />
        )}

        <input type="hidden" name="capability" value={capabilityToAdd} />
      </Form>

      <div className="flex gap-2 flex-wrap mb-3">
        {managerCapability.map((grantedCapability) => (
          <Form key={grantedCapability} method="post" className="inline">
            <input type="hidden" name="capability" value={grantedCapability} />
            <input type="hidden" name="intent" value="deleteCapability" />

            <div className="flex items-center gap-1 bg-gray-100 text-black px-3 py-1 rounded select-none">
              {grantedCapability}

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
  } else if (intent === "setDiscordName") {
    const discordName = String(formData.get("discordName") ?? "").trim();

    await context.workerManager.updateWorkerState(id, () => ({
      discordName: discordName || undefined,
    }));

    return { savedDiscordName: discordName };
  } else if (intent === "addCapability") {
    const raw = String(formData.get("capability") ?? "");

    const newCapabilities = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    const worker = await context.workerManager.getWorker(id);
    const current = worker?.state.managerCapabilities || [];

    const merged = Array.from(new Set([...current, ...newCapabilities]));

    await context.workerManager.updateWorkerState(id, () => ({
      managerCapabilities: merged,
    }));

  } else if (intent === "deleteCapability") {
    const toRemove = String(formData.get("capability") ?? "");
    const worker = await context.workerManager.getWorker(id);
    const current = worker?.state.managerCapabilities || [];

    const updated = current.filter((entry) => entry !== toRemove);

    await context.workerManager.updateWorkerState(id, () => ({
      managerCapabilities: updated,
    }));
  }

  return null;
};
