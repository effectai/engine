import { useLoaderData } from "@remix-run/react";
import { DataTable } from "~/components/data-table";
import { columns } from "./columns";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Input } from "@/app/components/ui/input";
import { useMemo, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { FilterMenu } from "@/app/components/filter-menu";
import { Search, X } from "lucide-react";
import { formatCapabilityId } from "@/app/lib/utils";
import { availableCapabilities } from "@effectai/capabilities";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "banned", label: "Banned" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];
type CapabilityMatchMode = "any" | "all";

const describeCapability = (capabilityId: string) => {
  const capability = availableCapabilities.find(
    (candidate) => candidate.id === capabilityId,
  );
  if (capability) return capability.name;

  const disabledFor = availableCapabilities.find(
    (candidate) => candidate.antiCapability === capabilityId,
  );
  if (disabledFor) return `${disabledFor.name} (disabled)`;

  return formatCapabilityId(capabilityId);
};

export async function loader({ context }: LoaderFunctionArgs) {
  const workers = await context.workerManager.all();
  const queue = context.workerManager.workerQueue.getQueue();

  const mappedWorkers = workers.map((worker) => ({
    state: {
      ...worker.state,
      isOnline: queue.includes(worker.state.peerId),
    },
  }));

  // Offer every capability that at least one worker actually holds, whether it
  // was self-reported or granted by an admin.
  const knownCapabilities = new Set<string>();
  for (const worker of mappedWorkers) {
    for (const capability of worker.state.capabilities ?? []) {
      knownCapabilities.add(capability);
    }
    for (const capability of worker.state.managerCapabilities ?? []) {
      knownCapabilities.add(capability);
    }
  }

  const capabilityOptions = [...knownCapabilities]
    // Workers with no capabilities report "", which stores as [""].
    .filter(Boolean)
    .map((capabilityId) => ({
      id: capabilityId,
      label: describeCapability(capabilityId),
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

  return { workers: mappedWorkers, capabilityOptions };
}

export default function Component() {
  const { workers, capabilityOptions } = useLoaderData<typeof loader>();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [capabilityMatchMode, setCapabilityMatchMode] =
    useState<CapabilityMatchMode>("any");

  const toggleCapability = (capabilityId: string) => {
    setSelectedCapabilities((current) =>
      current.includes(capabilityId)
        ? current.filter((selected) => selected !== capabilityId)
        : [...current, capabilityId],
    );
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setSelectedCapabilities([]);
  };

  const activeFilterCount =
    (statusFilter === "all" ? 0 : 1) + selectedCapabilities.length;

  const filteredWorkers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return workers.filter(({ state }) => {
      const matchesSearch =
        term === "" ||
        state.peerId.toLowerCase().includes(term) ||
        (state.accessCodeRedeemed?.toLowerCase().includes(term) ?? false) ||
        (state.discordName?.toLowerCase().includes(term) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "online" && state.isOnline) ||
        (statusFilter === "offline" && !state.isOnline && !state.banned) ||
        (statusFilter === "banned" && state.banned);

      const workerCapabilities = [
        ...(state.capabilities ?? []),
        ...(state.managerCapabilities ?? []),
      ];

      const matchesCapabilities =
        selectedCapabilities.length === 0 ||
        (capabilityMatchMode === "all"
          ? selectedCapabilities.every((capabilityId) =>
              workerCapabilities.includes(capabilityId),
            )
          : selectedCapabilities.some((capabilityId) =>
              workerCapabilities.includes(capabilityId),
            ));

      return matchesSearch && matchesStatus && matchesCapabilities;
    });
  }, [
    workers,
    searchTerm,
    statusFilter,
    selectedCapabilities,
    capabilityMatchMode,
  ]);

  const activeStatusLabel = STATUS_FILTERS.find(
    (option) => option.value === statusFilter,
  )?.label;

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[18rem] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, access code or Discord name"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8 pr-8"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <FilterMenu activeCount={activeFilterCount}>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={
                      statusFilter === option.value ? "default" : "outline"
                    }
                    onClick={() => setStatusFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Capabilities
                </p>
                {selectedCapabilities.length > 1 && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={
                        capabilityMatchMode === "any" ? "default" : "ghost"
                      }
                      onClick={() => setCapabilityMatchMode("any")}
                    >
                      Any
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        capabilityMatchMode === "all" ? "default" : "ghost"
                      }
                      onClick={() => setCapabilityMatchMode("all")}
                    >
                      All
                    </Button>
                  </div>
                )}
              </div>

              {capabilityOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No worker has reported a capability yet.
                </p>
              ) : (
                <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                  {capabilityOptions.map((option) => (
                    <label
                      key={option.id}
                      title={option.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selectedCapabilities.includes(option.id)}
                        onChange={() => toggleCapability(option.id)}
                      />
                      <span className="truncate">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          </div>
        </FilterMenu>

        <span className="ml-auto text-sm text-muted-foreground">
          {filteredWorkers.length} of {workers.length} workers
        </span>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {activeStatusLabel}
              <button
                type="button"
                aria-label="Clear status filter"
                onClick={() => setStatusFilter("all")}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {selectedCapabilities.map((capabilityId) => (
            <Badge key={capabilityId} variant="secondary" className="gap-1">
              {describeCapability(capabilityId)}
              <button
                type="button"
                aria-label={`Remove ${describeCapability(capabilityId)} filter`}
                onClick={() => toggleCapability(capabilityId)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <DataTable columns={columns} data={filteredWorkers} />
    </div>
  );
}
