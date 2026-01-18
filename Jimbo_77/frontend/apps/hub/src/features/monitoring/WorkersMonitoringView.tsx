import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Worker {
  id: string;
  name: string;
  route: string;
  status: "healthy" | "degraded" | "down";
  uptime: number;
  errorRate: number;
  requestsPerMin: number;
  lastDeploy: string;
  costPerDay: number;
}

export function WorkersMonitoringView() {
  const [workers, setWorkers] = React.useState<Worker[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedWorker, setSelectedWorker] = React.useState<Worker | null>(
    null
  );

  // Mock data - będzie zastąpione API call do Cloudflare
  React.useEffect(() => {
    const mockWorkers: Worker[] = [
      {
        id: "1",
        name: "jimbo77-agents-orchestrator",
        route: "orchestrator.jimbo77.com",
        status: "healthy",
        uptime: 99.8,
        errorRate: 0.02,
        requestsPerMin: 145,
        lastDeploy: "2026-01-14T10:30:00Z",
        costPerDay: 0.12,
      },
      {
        id: "2",
        name: "jimbo-like-pumo-api",
        route: "jimbo-like-pumo-api.stolarnia-ams.workers.dev",
        status: "healthy",
        uptime: 99.5,
        errorRate: 0.05,
        requestsPerMin: 89,
        lastDeploy: "2026-01-13T15:20:00Z",
        costPerDay: 0.08,
      },
      {
        id: "3",
        name: "jimbo-catalog-gateway",
        route: "catalog.jimbo77.com",
        status: "degraded",
        uptime: 97.2,
        errorRate: 2.3,
        requestsPerMin: 234,
        lastDeploy: "2026-01-12T09:15:00Z",
        costPerDay: 0.15,
      },
      {
        id: "4",
        name: "jimbo-angels-worker",
        route: "angels.jimbo77.com",
        status: "healthy",
        uptime: 99.9,
        errorRate: 0.01,
        requestsPerMin: 67,
        lastDeploy: "2026-01-15T08:00:00Z",
        costPerDay: 0.06,
      },
      {
        id: "5",
        name: "mybonzo-main-worker",
        route: "mybonzo.com",
        status: "healthy",
        uptime: 99.7,
        errorRate: 0.03,
        requestsPerMin: 312,
        lastDeploy: "2026-01-14T14:45:00Z",
        costPerDay: 0.21,
      },
    ];

    setTimeout(() => {
      setWorkers(mockWorkers);
      setLoading(false);
    }, 500);
  }, []);

  const totalCost = workers.reduce((sum, w) => sum + w.costPerDay, 0);
  const totalRequests = workers.reduce((sum, w) => sum + w.requestsPerMin, 0);
  const avgUptime =
    workers.reduce((sum, w) => sum + w.uptime, 0) / workers.length;

  const healthyCount = workers.filter((w) => w.status === "healthy").length;
  const degradedCount = workers.filter((w) => w.status === "degraded").length;
  const downCount = workers.filter((w) => w.status === "down").length;

  // Mock chart data
  const chartData = [
    { time: "00:00", requests: 120, errors: 2 },
    { time: "04:00", requests: 85, errors: 1 },
    { time: "08:00", requests: 340, errors: 5 },
    { time: "12:00", requests: 520, errors: 8 },
    { time: "16:00", requests: 680, errors: 12 },
    { time: "20:00", requests: 450, errors: 6 },
    { time: "23:59", requests: 280, errors: 3 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workers Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time status of 35 Cloudflare Workers
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
            Refresh
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Deploy All
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Total Workers</div>
          <div className="text-3xl font-bold mt-2">{workers.length}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <span className="text-green-500">{healthyCount} healthy</span>
            {degradedCount > 0 && (
              <span className="text-yellow-500 ml-2">
                {degradedCount} degraded
              </span>
            )}
            {downCount > 0 && (
              <span className="text-red-500 ml-2">{downCount} down</span>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Avg Uptime</div>
          <div className="text-3xl font-bold mt-2">{avgUptime.toFixed(2)}%</div>
          <div className="text-xs text-green-500 mt-1">↑ Target: 99.5%</div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">
            Total Requests/min
          </div>
          <div className="text-3xl font-bold mt-2">
            {totalRequests.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Across all workers
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Daily Cost</div>
          <div className="text-3xl font-bold mt-2">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            ${(totalCost * 30).toFixed(2)}/month
          </div>
        </div>
      </div>

      {/* Request Volume Chart */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Request Volume (24h)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            {/* @ts-ignore */}
            <Line
              type="monotone"
              dataKey="requests"
              stroke="#8884d8"
              strokeWidth={2}
            />
            {/* @ts-ignore */}
            <Line
              type="monotone"
              dataKey="errors"
              stroke="#ff4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Workers List */}
      <div className="border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Workers Status</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading workers...
          </div>
        ) : (
          <div className="divide-y">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => setSelectedWorker(worker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          worker.status === "healthy"
                            ? "bg-green-500"
                            : worker.status === "degraded"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                      <div>
                        <div className="font-semibold">{worker.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {worker.route}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-8 text-sm">
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-semibold">{worker.uptime}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Error Rate</div>
                      <div className="font-semibold">{worker.errorRate}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Req/min</div>
                      <div className="font-semibold">
                        {worker.requestsPerMin}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Cost/day</div>
                      <div className="font-semibold">${worker.costPerDay}</div>
                    </div>
                  </div>

                  <button className="ml-4 px-3 py-1 text-sm border rounded hover:bg-secondary">
                    Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Worker Details Modal */}
      {selectedWorker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedWorker(null)}
        >
          <div
            className="bg-background border rounded-lg p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">{selectedWorker.name}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-semibold capitalize">
                    {selectedWorker.status}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Route</div>
                  <div className="font-semibold text-sm">
                    {selectedWorker.route}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                  <div className="font-semibold">{selectedWorker.uptime}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Error Rate
                  </div>
                  <div className="font-semibold">
                    {selectedWorker.errorRate}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Requests/min
                  </div>
                  <div className="font-semibold">
                    {selectedWorker.requestsPerMin}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Daily Cost
                  </div>
                  <div className="font-semibold">
                    ${selectedWorker.costPerDay}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-muted-foreground">
                    Last Deployment
                  </div>
                  <div className="font-semibold">
                    {new Date(selectedWorker.lastDeploy).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                  Restart Worker
                </button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
                  View Logs
                </button>
                <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
                  Redeploy
                </button>
                <button
                  className="ml-auto px-4 py-2 border rounded hover:bg-secondary"
                  onClick={() => setSelectedWorker(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
