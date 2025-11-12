"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SimpleChartProps {
  data: number[];
  labels: string[];
  type: "line" | "bar" | "area";
  title: string;
  color?: string;
}

export function SimpleChart({
  data,
  labels,
  type,
  title,
  color = "#3B82F6",
}: SimpleChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: labels.length > 0 ? labels : data.map((_, i) => `Point ${i + 1}`),
      datasets: [
        {
          label: title,
          data: data,
          borderColor: color,
          backgroundColor: type === "area" ? `${color}20` : color,
          borderWidth: 2,
          fill: type === "area",
          tension: 0.4,
        },
      ],
    };
  }, [data, labels, title, color, type]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 14,
        },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (type === "bar") {
    return <Bar data={chartData} options={options} />;
  }

  return <Line data={chartData} options={options} />;
}
