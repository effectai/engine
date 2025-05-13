import {
  MoreVertical,
  ExternalLink,
  FileText,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Badge } from "~/components/ui/badge";
import { Task } from "@effectai/protocol-core";
import { Link } from "@remix-run/react";
import type { ManagerTaskRecord } from "@effectai/manager";
import { decodeTime } from "ulid";

interface TasksTableProps {
  tasks: ManagerTaskRecord[];
}

export function TasksTable({ tasks, index }: TasksTableProps) {
  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>Title</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead className="">Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end space-x-1">
                <span>Reward</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-right">Time Limit</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No tasks found.
              </TableCell>
            </TableRow>
          ) : (
            tasks.map((task) => {
              return (
                <TableRow
                  key={task.state.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-medium">
                    <Link
                      to={`/tasks/${index}/${task.state.id}`}
                      className="flex items-center hover:underline"
                    >
                      {task.state.title}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="">
                    {new Date(decodeTime(task.state.id)).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {task.events[task.events.length - 1].type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {(Number(task.state.reward) / 1e6).toFixed(6)} EFFECT
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end">
                      <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                      {task.state.timeLimitSeconds > 3600
                        ? `${Math.floor(task.state.timeLimitSeconds / 3600)} hours`
                        : `${Math.floor(task.state.timeLimitSeconds / 60)} minutes`}
                    </div>
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
                            navigator.clipboard.writeText(task.id);
                          }}
                        >
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/tasks/${index}/${task.state.id}`}>
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled onClick={() => {}}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Template Data
                        </DropdownMenuItem>
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
