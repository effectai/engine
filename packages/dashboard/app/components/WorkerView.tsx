import { WorkerRecord } from "../../../../../dist/manager/stores/managerWorkerStore";

export default function WorkerView({
  workers,
  onBan,
}: {
  workers: WorkerRecord[];
  onBan: (peerId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Workers List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Connected Workers ({workers.length})
        </h2>
        {workers.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {workers.map((worker) => (
              <li
                key={worker.state.peerId}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{worker.state.peerId}</p>
                  <p className="text-sm text-gray-500">
                    {worker.state.recipient}
                  </p>
                </div>
                <button
                  onClick={() => onBan(worker.state.peerId)}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                >
                  Ban
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No workers connected</p>
        )}
      </div>
    </div>
  );
}
