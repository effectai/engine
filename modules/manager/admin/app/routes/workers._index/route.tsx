import { useLoaderData } from "@remix-run/react";
import { DataTable } from "~/components/data-table";
import { columns } from "./columns";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Input } from "@/app/components/ui/input";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const workers = await context.workerManager.all();
  const queue = context.workerManager.workerQueue.getQueue();

  const mappedWorkers = workers.map((worker) => ({
    state: {
      ...worker.state,
      isOnline: queue.includes(worker.state.peerId),
    },
  }));

  return { workers: mappedWorkers };
}

export default function Component() {
  const { workers } = useLoaderData<typeof loader>();

  const [searchID, setSearchID] = useState("");
  const [searchAC, setSearchAC] = useState("");

  const [showSearchID, setShowSearchID] = useState(false);
  const [showSearchAC, setShowSearchAC] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");

  // Derived filtered list
  const filtered = workers.filter((w) => {
    const matchesID =
      searchID === "" || w.state.peerId.toLowerCase().includes(searchID.toLowerCase());
    const matchesAC =
      searchAC === "" ||
      w.state.accessCodeRedeemed?.toLowerCase().includes(searchAC.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && w.state.isOnline) ||
      (statusFilter === "offline" && !w.state.isOnline && !w.state.banned) ||
      (statusFilter === "banned" && w.state.banned);

    return matchesID && matchesAC && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
      {showSearchID && (
        <Input
          placeholder="Search by ID"
          value={searchID}
          onChange={(e) => setSearchID(e.target.value)}
          className="max-w-sm"
        />
      )}
      {showSearchAC && (
        <Input
          placeholder="Search by Access Code"
          value={searchAC}
          onChange={(e) => setSearchAC(e.target.value)}
          className="max-w-sm"
        />
      )}
      <div className="flex gap-2">
        <Button variant={statusFilter === "all" ? "default" : "ghost"} onClick={() => setStatusFilter("all")}>
          All
        </Button>
        <Button variant={statusFilter === "online" ? "green" : "ghost"} onClick={() => setStatusFilter("online")}>
          Online
        </Button>
        <Button variant={statusFilter === "offline" ? "destructive" : "ghost"} onClick={() => setStatusFilter("offline")}>
          Offline
        </Button>
        <Button variant={statusFilter === "banned" ? "purple" : "ghost"} onClick={() => setStatusFilter("banned")}>
          Banned
        </Button>
      </div>

      <DataTable
        columns={columns({
          onSearchIDClick: () => {
            setShowSearchID(true)   // always show ID search
            setShowSearchAC(false)  // always hide AC search
          },
          onSearchACClick: () => {
            setShowSearchAC(true)   // always show AC search
            setShowSearchID(false)  // always hide ID search
          }
        })}
        data={filtered}
      />
    </div>
  );
}
