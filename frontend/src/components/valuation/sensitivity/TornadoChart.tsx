'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TornadoChartProps {
  data: Array<{
    name: string;
    impact: number;
  }>;
}

export function TornadoChart({ data }: TornadoChartProps) {
  // مرتب‌سازی بر اساس تأثیر (بیشترین به کمترین)
  const sortedData = [...data].sort((a, b) => b.impact - a.impact);

  const maxImpact = Math.max(...sortedData.map(d => Math.abs(d.impact)), 1);

  const getColor = (impact: number) => {
    const ratio = Math.abs(impact) / maxImpact;
    if (ratio > 0.7) return 'rgba(239, 68, 68, 0.85)';
    if (ratio > 0.4) return 'rgba(251, 191, 36, 0.85)';
    return 'rgba(59, 130, 246, 0.85)';
  };

  const getBorderColor = (impact: number) => {
    const ratio = Math.abs(impact) / maxImpact;
    if (ratio > 0.7) return 'rgb(239, 68, 68)';
    if (ratio > 0.4) return 'rgb(251, 191, 36)';
    return 'rgb(59, 130, 246)';
  };

  const chartData = {
    labels: sortedData.map(d => d.name),
    datasets: [
      {
        label: 'درصد تأثیر',
        data: sortedData.map(d => d.impact),
        backgroundColor: sortedData.map(d => getColor(d.impact)),
        borderColor: sortedData.map(d => getBorderColor(d.impact)),
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.7,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `تأثیر: ${context.parsed.x.toFixed(1)}%`;
          }
        },
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#1a1a1a',
        bodyColor: '#1a1a1a',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          family: 'Vazir, sans-serif',
          size: 13,
          weight: '600' as const,
        },
        bodyFont: {
          family: 'Vazir, sans-serif',
          size: 12,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.06)',
          drawBorder: false,
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
          font: {
            family: 'Vazir, sans-serif',
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Vazir, sans-serif',
            size: 13,
            weight: '500' as const,
          },
          color: '#1a1a1a',
        },
      },
    },
    animation: {
      duration: 500,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  // 🔥 کلید برای اجبار به رندر مجدد
  return (
    <div style={{ height: '400px', width: '100%', direction: 'rtl' }} key={JSON.stringify(data.map(d => d.impact))}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
