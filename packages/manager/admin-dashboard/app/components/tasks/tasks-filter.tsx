import { Filter } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

interface TasksFilterProps {
  filter: string;
  setFilter: (filter: string) => void;
  total: number;
}

export function TasksFilter({ filter, setFilter, total }: TasksFilterProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={cn(
            "justify-start md:justify-center",
            filter === "all" && "shadow-sm",
          )}
        >
          All Tasks
          <span className="ml-auto md:ml-2 text-xs">{total}</span>
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("active")}
          className={cn(
            "justify-start md:justify-center",
            filter === "active" && "shadow-sm",
          )}
          disabled
        >
          Active
          <span className="ml-auto md:ml-2 text-xs">0</span>
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
          className={cn(
            "justify-start md:justify-center",
            filter === "completed" && "shadow-sm",
          )}
          disabled
        >
          Completed
          <span className="ml-auto md:ml-2 text-xs">0</span>
        </Button>
      </div>
    </div>
  );
}
