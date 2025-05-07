import { ManagerContext, peerIdFromString } from "@effectai/protocol";
import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";

export const action: ActionFunction = async ({
  request,
  context,
}: {
  request: Request;
  context: ManagerContext;
}) => {
  const formData = await request.formData();
  const peerIdStr = formData.get("peerId");

  if (typeof peerIdStr !== "string") {
    throw new Error("Invalid peerId");
  }

  await context.workerManager.updateWorkerState(peerIdStr, {
    banned: false,
  });

  return json({ success: true });
};
