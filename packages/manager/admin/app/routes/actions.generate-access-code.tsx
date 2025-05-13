import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { ManagerContext } from "../../../dist";

export const action: ActionFunction = async ({
  request,
  context,
}: {
  request: Request;
  context: ManagerContext;
}) => {
  const code = await context.workerManager.generateAccessCode();

  return json({ code });
};
