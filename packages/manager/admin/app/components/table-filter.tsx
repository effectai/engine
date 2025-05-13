import { Filter } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

interface TableFilterProps {
  filters: { key: string; total: number }[];
  setFilter: (filter: string) => void;
}

export function TableFilter({ filters, setFilter }: TableFilterProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
        {filters.map((filter) => (
          <Button
            variant={filter.key === "active" ? "default" : "outline"}
            onClick={() => setFilter(filter.key)}
            key={filter.key}
            size="sm"
            className={cn(
              "justify-start md:justify-center capitalize",
              filter.key === "active" && "shadow-sm",
            )}
          >
            {filter.key}
            <span className="ml-auto md:ml-2 text-xs">{filter.total}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
