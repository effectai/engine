"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatReward, sliceBoth } from "@/app/lib/utils";
import { Link } from "@remix-run/react";
import type { WorkerState } from "../../../../dist/stores/managerWorkerStore";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, Circle, CircleOff, Search } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";

const calculateSuccessRate = (item: WorkerData) => {
  return (item.state.tasksCompleted / item.state.totalTasks) * 100;
};

export type WorkerData = {
  state: WorkerState & {
    isOnline: boolean;
  };
};

// 🔑 columns is now a function that takes callbacks
export const columns = ({
  onSearchIDClick,
  onSearchACClick,
}: {
  onSearchIDClick: () => void;
  onSearchACClick: () => void;
}): ColumnDef<WorkerData>[] => [
  {
    accessorKey: "state.isOnline",
    header: "Status",
    cell: ({ row }) => {
      const isOnline = row.original.state.isOnline;
      const isBanned = row.original.state.banned;

      return (
        <Badge variant={isBanned ? "purple" : isOnline ? "green" : "destructive"} className="gap-2">
          {isBanned ? (
            <>
              <Circle className="h-3 w-3 fill-current" />
              Banned
            </>
          ) : (
            isOnline ? (
              <>
                <Circle className="h-3 w-3 fill-current" />
                Online
              </>
            ) : (
              <>
                <CircleOff className="h-3 w-3" />
                Offline
              </>
            )
          )}
        </Badge>
      );
    },
  },
  {
    accessorKey: "state.id",
    header: () => (
      <Button variant="ghost" onClick={onSearchIDClick}>
        ID
        <Search className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const id = row.original.state.peerId;
      return (
        <Link
          to={`/workers/${id}`}
          className="text-blue-500 hover:text-blue-700"
        >
          {sliceBoth(id)}
        </Link>
      );
    },
  },
  {
    accessorKey: "state.lastActivity",
    header: "Last Activity",
    cell: ({ row }) => {
      const distance = formatDistanceToNow(
        new Date(row.original.state.lastActivity * 1000),
        { addSuffix: true }
      );
      return <span>{distance}</span>;
    },
  },
  {
    accessorKey: "state.accessCodeRedeemed",
    header: () => (
      <Button variant="ghost" onClick={onSearchACClick}>
        Access Code
        <Search className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "successRate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Success Rate
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    sortingFn: (rowA, rowB) => {
      const successRateA = calculateSuccessRate(rowA.original);
      const successRateB = calculateSuccessRate(rowB.original);
      return successRateB - successRateA;
    },
    cell: ({ row }) => {
      const successRate =
        row.original.state.tasksCompleted > 0
          ? (
              (row.original.state.tasksCompleted /
                row.original.state.totalTasks) *
              100
            ).toFixed(1)
          : "0.0";

      return (
        <span>
          {successRate}% ({row.original.state.tasksCompleted}/
          {row.original.state.totalTasks})
        </span>
      );
    },
  },
  {
    accessorKey: "state.totalEarned",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total Earned
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) =>
      row.original.state.totalEarned ? (
        <span>
          {formatReward(BigInt(row.original.state.totalEarned))} EFFECT
        </span>
      ) : (
        0n
      ),
  },
];
