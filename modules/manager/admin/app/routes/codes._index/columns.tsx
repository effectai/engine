"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { sliceBoth } from "@/app/lib/utils";
import { Link, useNavigate } from "@remix-run/react";
import type { WorkerRecord } from "../../../../dist/stores/managerWorkerStore";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { AccessCodeRecord } from "../../../../dist/stores/managerAccessCodeStore";
import { Badge } from "@/app/components/ui/badge";

export const columns: ColumnDef<AccessCodeRecord>[] = [
  {
    accessorKey: "state.code",
    header: "code",
  },
  {
    id: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    sortingFn: (rowA, rowB) => {
      const getDate = (row) => {
        if (!row.original.events || row.original.events.length === 0) return 0;
        const timestamp = row.original.events[0]?.timestamp;
        return timestamp ? new Date(timestamp * 1000) : 0;
      };

      const dateA = getDate(rowA);
      const dateB = getDate(rowB);

      return dateA - dateB;
    },
    cell: ({ row }) => {
      const created = row.original.events.find((e) => e.type === "create");
      const timestamp = new Date(created!.timestamp * 1000);
      return timestamp.toLocaleDateString();
    },
  },
  {
    id: "redeemed",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Redeemed
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    sortingFn: (rowA, rowB) => {
      const hasRedeemedA =
        rowA.original.events?.some((e) => e.type === "redeem") ?? false;
      const hasRedeemedB =
        rowB.original.events?.some((e) => e.type === "redeem") ?? false;

      return hasRedeemedA === hasRedeemedB ? 0 : hasRedeemedA ? -1 : 1;
    },
    cell: ({ row }) => {
      const redeemed = row.original.events.find((e) => e.type === "redeem");
      return redeemed ? (
        <Badge color="green">Yes</Badge>
      ) : (
        <Badge variant="destructive">No</Badge>
      );
    },
  },
];
