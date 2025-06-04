"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { sliceBoth } from "@/app/lib/utils";
import { Link, useNavigate } from "@remix-run/react";
import type { WorkerRecord } from "../../../../dist/stores/managerWorkerStore";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const calculateSuccessRate = (item: WorkerRecord) => {
  return (item.state.tasksCompleted / item.state.totalTasks) * 100;
};

export const columns: ColumnDef<WorkerRecord>[] = [
  {
    accessorKey: "state.id",
    header: "ID",
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
      //get time ago from timestamp
      const distance = formatDistanceToNow(
        new Date(row.original.state.lastActivity * 1000),
        {
          addSuffix: true,
        },
      );

      return <span>{distance}</span>;
    },
  },
  {
    accessorKey: "state.accessCodeRedeemed",
    header: "Access Code",
  },
  {
    id: "successRate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Success Rate
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
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
          {successRate}% ({row.original.state.tasksCompleted} /{" "}
          {row.original.state.totalTasks})
        </span>
      );
    },
  },
  {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Earned
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    accessorKey: "state.totalEarned",
    cell: ({ row }) => {
      return row.original.state.totalEarned ? (
        <span>
          {(BigInt(row.original.state.totalEarned) / BigInt(1e6)).toString()}
        </span>
      ) : (
        0n
      );
    },
  },
];
