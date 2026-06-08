'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  gradient: string;
}

export default function MetricCard({ title, value, subtext, icon, gradient }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-950 dark:hover:border-zinc-700">
      {/* Background glow */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 blur-xl transition-all duration-300 group-hover:opacity-10`} />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {value}
          </h3>
          {subtext && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{subtext}</p>
          )}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
