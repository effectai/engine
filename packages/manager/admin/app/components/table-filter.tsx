import { useLocation, Link } from "@remix-run/react";
import { Filter } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "./../lib/utils";

interface TableFilterProps {
  filters: {
    key: string;
    total: number;
  }[];
  setFilter?: (filter: string) => void;
  queryParam?: string;
  currentFilter?: string;
}

export function TableFilter({
  filters,
  queryParam = "filter",
  currentFilter,
}: TableFilterProps) {
  const location = useLocation();

  const buildFilterUrl = (filterKey: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(queryParam, filterKey);
    searchParams.delete("page"); // Reset to first page when filter changes
    return `${location.pathname}?${searchParams.toString()}`;
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Filters</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
        {filters.map((filter) => (
          <Button
            asChild
            variant={filter.key === currentFilter ? "default" : "outline"}
            key={filter.key}
            size="sm"
            className={cn(
              "justify-start md:justify-center capitalize",
              filter.key === currentFilter && "shadow-sm",
            )}
          >
            <Link to={buildFilterUrl(filter.key)}>
              {filter.key}
              <span className="ml-auto md:ml-2 text-xs">
                {filter.key === currentFilter ? filter.total : "-"}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
