"use client";

import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const kpiData = [
    {
      title: "Total Reports",
      value: "156",
      change: "+2.5%",
      trend: "up",
      icon: FileText,
    },
    {
      title: "Active Users",
      value: "2,847",
      change: "+0.5%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Generated Charts",
      value: "1,136",
      change: "-0.2%",
      trend: "down",
      icon: Activity,
    },
    {
      title: "System Uptime",
      value: "99.9%",
      change: "+0.12%",
      trend: "up",
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your NFF Auto Report system performance and metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div
            key={index}
            className="bg-card p-6 rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-[#707FDD] to-[#5A6BC7] rounded-lg">
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center">
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-[#707FDD] mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    kpi.trend === "up" ? "text-[#707FDD]" : "text-red-600"
                  }`}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {kpi.title}
            </h2>
            <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Report Generation Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chart visualization coming soon</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            System Performance
          </h3>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Performance metrics coming soon</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#707FDD]/10 dark:bg-[#707FDD]/20 rounded-lg">
                <FileText className="h-4 w-4 text-[#707FDD] dark:text-[#707FDD]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Weekly Tactical Review generated
                </p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-[#707FDD]/10 dark:bg-[#707FDD]/20 text-[#707FDD] dark:text-[#707FDD] text-xs rounded-full">
              Completed
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Morning Brief published
                </p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
              Published
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  New user registered
                </p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full">
              New
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
