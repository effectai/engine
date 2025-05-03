import { ActionFunctionArgs, json } from "@remix-run/node";
import { getManager } from "~/service/manager.service";

export async function action({ request, context }: ActionFunctionArgs) {
  const { workerId } = await request.json();
  const manager = await getManager();

  const worker = await manager.workerManager.updateWorkerState("peer-id", {
    banned: true,
  });

  return json({ success: true });
}
