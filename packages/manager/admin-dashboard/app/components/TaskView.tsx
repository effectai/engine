import type { ManagerTaskRecord, Task } from "@effectai/protocol";

import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ClockIcon, CoinsIcon, HashIcon } from "lucide-react";

const getLastEvent = (task: ManagerTaskRecord) => {
  return task.events[task.events.length - 1];
};

export function TaskView({ tasks }: { tasks: ManagerTaskRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HashIcon className="w-5 h-5" />
          Active Tasks
          <Badge variant="outline" className="ml-auto">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {tasks.length > 0 ? (
            <ul className="divide-y">
              {tasks.map((task) => {
                const lastEvent = getLastEvent(task);

                return (
                  <li
                    key={task.state.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">
                            {task.state.id.slice(0, 8)}...
                            {task.state.id.slice(-4)}
                          </p>
                          <Badge
                            variant={getStatusBadgeVariant(lastEvent.type)}
                          >
                            {lastEvent.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <CoinsIcon className="w-4 h-4" />
                                <span>
                                  {parseFloat(
                                    task.state.reward.toString(),
                                  ).toFixed(4)}{" "}
                                  ETH
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reward amount</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <ClockIcon className="w-4 h-4" />
                                <span>
                                  {new Date(
                                    lastEvent.timestamp,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Last updated</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => handleTaskDetails(task.state.id)}
                      >
                        Details
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <HashIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No active tasks
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tasks will appear here when created
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper function for status badge variants
function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "default";
    case "failed":
      return "destructive";
    case "pending":
      return "secondary";
    case "active":
      return "outline";
    default:
      return "outline";
  }
}
