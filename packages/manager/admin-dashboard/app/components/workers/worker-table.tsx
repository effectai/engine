import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { WorkerState } from "../../../dist/stores/managerWorkerStore";
import { Link } from "@remix-run/react";

interface WorkersTableProps {
  workers: WorkerState[];
  onBan: (peerId: string) => void;
  onUnban: (peerId: string) => void;
}

export function WorkersTable({ workers, onBan, onUnban }: WorkersTableProps) {
  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Status</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="text-right">Success Rate</TableHead>
            <TableHead className="text-right">Tasks</TableHead>
            <TableHead className="text-right">Last Payout</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No workers found.
              </TableCell>
            </TableRow>
          ) : (
            workers.map((worker) => {
              const isActive = Date.now() - worker.lastActivity < 3600000; // 1 hour
              const successRate =
                worker.tasksCompleted > 0
                  ? ((worker.tasksCompleted / worker.totalTasks) * 100).toFixed(
                      1,
                    )
                  : "0.0";

              return (
                <TableRow
                  key={worker.peerId}
                  className={cn(
                    "transition-colors hover:bg-muted/50",
                    worker.banned && "bg-destructive/5",
                  )}
                >
                  <TableCell>
                    {worker.banned ? (
                      <XCircle className="h-5 w-5 text-destructive" />
                    ) : isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/workers/${worker.peerId}`}
                      className="flex items-center hover:underline"
                    >
                      {worker.peerId.slice(0, 12)}...
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(worker.lastActivity), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        parseFloat(successRate) > 90
                          ? "text-green-500"
                          : parseFloat(successRate) > 70
                            ? "text-amber-500"
                            : "text-destructive",
                      )}
                    >
                      {successRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {worker.tasksCompleted}/{worker.totalTasks}
                  </TableCell>
                  <TableCell className="text-right">
                    {worker.lastPayout > 0
                      ? formatDistanceToNow(new Date(worker.lastPayout), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            navigator.clipboard.writeText(worker.peerId);
                          }}
                        >
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/workers/${worker.peerId}`}>
                            View details
                          </Link>
                        </DropdownMenuItem>
                        {worker.banned ? (
                          <DropdownMenuItem
                            onClick={() => onUnban(worker.peerId)}
                            className="text-green-500 focus:text-green-500"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Unban worker
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onBan(worker.peerId)}
                            className="text-destructive focus:text-destructive"
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Ban worker
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
