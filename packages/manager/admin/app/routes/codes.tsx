import { json, type MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { TasksTable } from "~/components/tasks/tasks-table";
import type { ManagerContext, ManagerTaskRecord } from "@effectai/manager";
import { serializeBigInts } from "~/utils/serialize";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { TableFilter } from "~/components/table-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export const loader = async ({ context }: { context: ManagerContext }) => {
  const accessCodes = await context.workerManager.getAccessCodes();

  return json({
    accessCodes,
  });
};

export default function TasksPage() {
  const { accessCodes } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleGenerate = () => {
    fetcher.submit(
      {},
      { method: "post", action: "/actions/generate-access-code" },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Access Codes</h1>
      <p className="text-muted-foreground">
        View and manage access codes here.
      </p>

      <Button onClick={() => handleGenerate()}>Generate</Button>

      <div className="flex flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Redeemed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accessCodes.map((code) => {
              return (
                <TableRow
                  key={code.state.code}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    {code.state.code}
                  </TableCell>

                  <TableCell>
                    {new Date(code.events[0].timestamp * 1000).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    {code.events.some((e) => e.type === "redeem") ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge variant="default">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
