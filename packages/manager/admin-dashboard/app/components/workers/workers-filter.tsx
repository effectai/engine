import { Filter } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

interface WorkersFilterProps {
  filter: string;
  setFilter: (filter: string) => void;
  total: number;
  active: number;
  banned: number;
  inactive: number;
}

export function WorkersFilter({
  filter,
  setFilter,
  total,
  active,
  banned,
  inactive,
}: WorkersFilterProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={cn(
            "justify-start md:justify-center",
            filter === "all" && "shadow-sm",
          )}
        >
          All
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
        >
          Active
          <span className="ml-auto md:ml-2 text-xs">{active}</span>
        </Button>
        <Button
          variant={filter === "banned" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("banned")}
          className={cn(
            "justify-start md:justify-center",
            filter === "banned" && "shadow-sm",
          )}
        >
          Banned
          <span className="ml-auto md:ml-2 text-xs">{banned}</span>
        </Button>
        <Button
          variant={filter === "inactive" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("inactive")}
          className={cn(
            "justify-start md:justify-center",
            filter === "inactive" && "shadow-sm",
          )}
        >
          Inactive
          <span className="ml-auto md:ml-2 text-xs">{inactive}</span>
        </Button>
      </div>
    </div>
  );
}
