"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import type { ManagerTaskRecord } from "../../../../dist";
import { Link, useNavigate } from "@remix-run/react";
import { formatReward, sliceBoth } from "@/app/lib/utils";

export const columns: ColumnDef<ManagerTaskRecord>[] = [
  {
    accessorKey: "state.id",
    header: "ID",
    cell: ({ row }) => {
      const taskId = row.original.state.id;
      return (
        <Link
          to={`/tasks/${taskId}`}
          className="text-blue-500 hover:text-blue-700"
        >
          {sliceBoth(taskId)}
        </Link>
      );
    },
  },
  {
    header: "status",
    cell: ({ row }) => {
      const lastEvent = row.original.events.slice(-1)[0];

      switch (lastEvent.type) {
        case "create":
          return (
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              Pending
            </Badge>
          );
        case "assign":
        case "accept":
          return (
            <Badge variant="outline" className="bg-yellow-400">
              {lastEvent.type}
            </Badge>
          );
        default:
          return (
            <Badge variant="outline" className="text-green-300">
              {lastEvent.type}
            </Badge>
          );
      }
    },
  },
  {
    accessorKey: "state.title",
    header: "Title",
  },
  {
    accessorKey: "state.reward",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Reward
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return formatReward(row.original.state.reward);
    },
  },
  {
    accessorKey: "state.timeLimitSeconds",
    header: "Time Limit (ms)",
  },
  {
    accessorKey: "state.templateId",
    header: "Template ID",
    cell: ({ row }) => {
      return sliceBoth(row.original.state.templateId);
    },
  },
];
