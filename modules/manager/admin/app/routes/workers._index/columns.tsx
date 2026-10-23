"use client";

import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import {
  formatEffect,
  formatTimestamp,
  getSuccessRate,
  sliceBoth,
  toDate,
} from "@/app/lib/utils";
import { Link } from "@remix-run/react";
import type { WorkerState } from "../../../../dist/stores/managerWorkerStore";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, Circle, CircleOff } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

export type WorkerData = {
  state: WorkerState & {
    isOnline: boolean;
  };
};

/**
 * Workers that have never been assigned a task have no success rate. Sorting
 * them as -1 keeps them grouped below genuine 0% workers instead of turning
 * into NaN, which would leave the row order untouched.
 */
const NO_SUCCESS_RATE = -1;

const sortableHeader =
  (label: string) =>
  <TValue,>({ column }: HeaderContext<WorkerData, TValue>) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

export const columns: ColumnDef<WorkerData>[] = [
  {
    accessorKey: "state.isOnline",
    header: "Status",
    cell: ({ row }) => {
      const isOnline = row.original.state.isOnline;
      const isBanned = row.original.state.banned;

      return (
        <Badge
          variant={isBanned ? "purple" : isOnline ? "green" : "destructive"}
          className="gap-2"
        >
          {isBanned ? (
            <>
              <Circle className="h-3 w-3 fill-current" />
              Banned
            </>
          ) : isOnline ? (
            <>
              <Circle className="h-3 w-3 fill-current" />
              Online
            </>
          ) : (
            <>
              <CircleOff className="h-3 w-3" />
              Offline
            </>
          )}
        </Badge>
      );
    },
  },
  {
    accessorKey: "state.peerId",
    header: "ID",
    cell: ({ row }) => {
      const id = row.original.state.peerId;
      return (
        <Link
          to={`/workers/${id}`}
          title={id}
          className="font-mono text-blue-500 hover:text-blue-700"
        >
          {sliceBoth(id)}
        </Link>
      );
    },
  },
  {
    accessorKey: "state.discordName",
    header: sortableHeader("Discord"),
    cell: ({ row }) => {
      const discordName = row.original.state.discordName;

      return discordName ? (
        <span>{discordName}</span>
      ) : (
        <span className="text-muted-foreground">Not linked</span>
      );
    },
  },
  {
    accessorKey: "state.lastActivity",
    header: sortableHeader("Last Activity"),
    cell: ({ row }) => {
      const lastActivity = row.original.state.lastActivity;

      if (!lastActivity) {
        return <span className="text-muted-foreground">Never</span>;
      }

      return (
        <span title={formatTimestamp(lastActivity)}>
          {formatDistanceToNow(toDate(lastActivity), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    accessorKey: "state.accessCodeRedeemed",
    header: "Access Code",
    cell: ({ row }) => {
      const accessCode = row.original.state.accessCodeRedeemed;

      return accessCode ? (
        <span className="font-mono">{accessCode}</span>
      ) : (
        <span className="text-muted-foreground">None</span>
      );
    },
  },
  {
    id: "successRate",
    accessorFn: (row) => getSuccessRate(row.state) ?? NO_SUCCESS_RATE,
    sortingFn: "basic",
    header: sortableHeader("Success Rate"),
    cell: ({ row }) => {
      const { tasksCompleted, totalTasks } = row.original.state;
      const successRate = getSuccessRate(row.original.state);

      if (successRate === null) {
        return <span className="text-muted-foreground">No tasks yet</span>;
      }

      return (
        <span>
          {successRate.toFixed(1)}% ({tasksCompleted}/{totalTasks})
        </span>
      );
    },
  },
  {
    accessorKey: "state.totalEarned",
    header: sortableHeader("Total Earned"),
    cell: ({ row }) => (
      <span>
        {formatEffect(BigInt(row.original.state.totalEarned ?? 0n), 2)} EFFECT
      </span>
    ),
  },
];
