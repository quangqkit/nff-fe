import { JobSummary } from '@/types';
import { CheckCircle, XCircle, Clock, ListChecks } from 'lucide-react';

interface JobStatsCardsProps {
  stats: JobSummary;
}

export function JobStatsCards({ stats }: JobStatsCardsProps) {
  const cards = [
    {
      label: 'Total Jobs',
      value: stats.total,
      icon: ListChecks,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      label: 'Running',
      value: stats.processing,
      icon: Clock,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: XCircle,
      color: 'from-red-500 to-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-3 bg-gradient-to-r ${card.color} rounded-lg`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {card.value}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {card.label}
          </p>
        </div>
      ))}
    </div>
  );
}

