export default function Monitoring() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          System Monitoring
        </h1>
        <p className="text-muted-foreground">
          Monitor system performance, health status, and real-time metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">Healthy</span>
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            System Health
          </h2>
          <p className="text-muted-foreground">
            All systems are running normally with optimal performance.
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">98.5%</span>
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Performance
          </h2>
          <p className="text-muted-foreground">
            System performance is excellent with 98.5% uptime.
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">247 users</span>
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Active Users
          </h2>
          <p className="text-muted-foreground">
            Currently 247 users are actively using the system.
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">Online</span>
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Server Status
          </h2>
          <p className="text-muted-foreground">
            All servers are online and responding normally.
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">Optimal</span>
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Database Health
          </h2>
          <p className="text-muted-foreground">
            Database performance is optimal with fast query response times.
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                />
              </svg>
            </div>
            <span className="text-sm text-muted-foreground">Stable</span>
          </div>
          <h2 className="text-xl font-semibold text-card-foreground mb-2">
            Network Status
          </h2>
          <p className="text-muted-foreground">
            Network connectivity is stable with low latency.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Real-time Metrics
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              CPU Usage
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Server 1</span>
                <span className="text-sm font-medium text-card-foreground">
                  45%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "45%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Server 2</span>
                <span className="text-sm font-medium text-card-foreground">
                  32%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "32%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Server 3</span>
                <span className="text-sm font-medium text-card-foreground">
                  67%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "67%" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-lg font-semibold text-card-foreground mb-4">
              Memory Usage
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Server 1</span>
                <span className="text-sm font-medium text-card-foreground">
                  2.1GB / 8GB
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: "26%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Server 2</span>
                <span className="text-sm font-medium text-card-foreground">
                  4.8GB / 16GB
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "30%" }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Server 3</span>
                <span className="text-sm font-medium text-card-foreground">
                  6.4GB / 8GB
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
