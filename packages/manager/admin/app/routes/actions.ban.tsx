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
    banned: true,
  });

  const peerId = peerIdFromString(peerIdStr);
  await context.manager.node.hangUp(peerId);

  return json({ success: true });
};
