import {
  Form,
  redirect,
  useLoaderData,
  useSearchParams,
} from "@remix-run/react";
import { DataTable } from "~/components/data-table";
import { columns } from "./columns";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Button } from "@/app/components/ui/button";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const codes = await context.workerManager.getAccessCodes();

  return {
    codes,
  };
}

export default function Component() {
  const { codes } = useLoaderData<typeof loader>();

  return (
    <div>
      <Form method="post" className="px-6">
        <Button type="submit">Generate</Button>
      </Form>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
        <DataTable columns={columns} data={codes} />
      </div>
    </div>
  );
}

export async function action({ request, context }: ActionFunctionArgs) {
  const code = await context.workerManager.generateAccessCode();

  return {
    code,
  };
}
