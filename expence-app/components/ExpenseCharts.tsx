'use client';

import React, { useState } from 'react';

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

interface MonthlyTrendData {
  year: number;
  month: number;
  total: number;
}

interface ExpenseChartsProps {
  categoryBreakdown: CategoryData[];
  monthlyTrend: MonthlyTrendData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#F59E0B',          // Amber
  Housing: '#3B82F6',       // Blue
  Transport: '#EF4444',     // Red
  'Snacks & Drinks': '#10B981', // Emerald
  Others: '#8B5CF6',        // Purple
};

const CATEGORY_TAILWIND_BG: Record<string, string> = {
  Food: 'bg-amber-500',
  Housing: 'bg-blue-500',
  Transport: 'bg-red-500',
  'Snacks & Drinks': 'bg-emerald-500',
  Others: 'bg-purple-500',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function ExpenseCharts({ categoryBreakdown, monthlyTrend }: ExpenseChartsProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // 1. Donut Chart Calculations
  const totalCategorySpend = categoryBreakdown.reduce((sum, item) => sum + item.total, 0);
  
  let accumulatedAngle = 0;
  const donutSegments = categoryBreakdown.map((item) => {
    const percentage = totalCategorySpend > 0 ? (item.total / totalCategorySpend) * 100 : 0;
    const angle = totalCategorySpend > 0 ? (item.total / totalCategorySpend) * 360 : 0;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      category: item.category,
      total: item.total,
      percentage,
      startAngle,
      angle,
      color: CATEGORY_COLORS[item.category] || '#6B7280',
    };
  });

  // SVG Donut slice helper (using stroke-dasharray approach)
  // Radius of circle = 50, strokeWidth = 16, circumference = 2 * Math.PI * 50 = 314.16
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // 2. Trend Chart Calculations
  const maxTrendSpend = monthlyTrend.reduce((max, item) => Math.max(max, item.total), 0) || 1;
  const barChartHeight = 160;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Category Breakdown (Donut Chart) */}
      <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 mb-6">
          Category Distribution
        </h3>
        
        {totalCategorySpend === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-zinc-400">
            No spending data to visualize
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 flex-1">
            {/* SVG Donut */}
            <div className="relative h-44 w-44">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke="#E4E4E7"
                  strokeWidth={strokeWidth}
                  className="dark:stroke-zinc-800"
                />
                {donutSegments.map((seg, idx) => {
                  const strokeDashoffset = circumference - (seg.percentage / 100) * circumference;
                  // Calculate cumulative offset
                  let previousPercentageSum = 0;
                  for (let i = 0; i < idx; i++) {
                    previousPercentageSum += donutSegments[i].percentage;
                  }
                  const strokeDashoffsetAccumulated = circumference - (previousPercentageSum / 100) * circumference;

                  const isHovered = hoveredCategory === seg.category;
                  
                  return (
                    <circle
                      key={seg.category}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffsetAccumulated}
                      className="transition-all duration-300 cursor-pointer"
                      style={{
                        transformOrigin: '60px 60px',
                      }}
                      onMouseEnter={() => setHoveredCategory(seg.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })}
              </svg>
              
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {hoveredCategory ? (
                  <>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      {hoveredCategory}
                    </span>
                    <span className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">
                      ₹{donutSegments.find(s => s.category === hoveredCategory)?.total.toLocaleString('en-IN') || 0}
                    </span>
                    <span className="text-xs font-semibold text-zinc-500">
                      {donutSegments.find(s => s.category === hoveredCategory)?.percentage.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Total Spend
                    </span>
                    <span className="text-xl font-extrabold text-zinc-900 dark:text-white mt-0.5">
                      ₹{totalCategorySpend.toLocaleString('en-IN')}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-3 justify-center">
              {donutSegments.map((seg) => (
                <div
                  key={seg.category}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    hoveredCategory === seg.category
                      ? 'bg-zinc-50 dark:bg-zinc-900'
                      : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                  }`}
                  onMouseEnter={() => setHoveredCategory(seg.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <span className={`h-3 w-3 rounded-full ${CATEGORY_TAILWIND_BG[seg.category] || 'bg-gray-500'}`} />
                  <div className="flex flex-col min-w-[100px]">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {seg.category}
                    </span>
                    <span className="text-xs font-semibold text-zinc-950 dark:text-white">
                      ₹{seg.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 ml-auto">
                    {seg.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trend (Bar Chart) */}
      <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 mb-6">
          Monthly Spend Trend
        </h3>

        {monthlyTrend.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-zinc-400">
            No history data available
          </div>
        ) : (
          <div className="flex flex-col justify-between flex-1">
            <div className="relative flex items-end justify-between h-[160px] px-2 pt-4 border-b border-zinc-100 dark:border-zinc-800">
              {/* Vertical Guide Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 text-[10px] text-zinc-400">
                <div className="border-t border-zinc-100 dark:border-zinc-900 w-full" />
                <div className="border-t border-zinc-100 dark:border-zinc-900 w-full" />
                <div className="border-t border-zinc-100 dark:border-zinc-900 w-full" />
              </div>

              {monthlyTrend.map((item, idx) => {
                const percentHeight = (item.total / maxTrendSpend) * 100;
                const isHovered = hoveredTrendIndex === idx;

                return (
                  <div
                    key={`${item.year}-${item.month}`}
                    className="group relative flex flex-col items-center flex-1 mx-2"
                    onMouseEnter={() => setHoveredTrendIndex(idx)}
                    onMouseLeave={() => setHoveredTrendIndex(null)}
                  >
                    {/* Tooltip */}
                    <div
                      className={`absolute -top-10 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold px-2.5 py-1 rounded shadow-md transition-opacity pointer-events-none z-10 ${
                        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                    >
                      ₹{item.total.toLocaleString('en-IN')}
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 shadow-sm transition-all duration-300 ease-out origin-bottom cursor-pointer"
                      style={{
                        height: `${Math.max(percentHeight, 4)}%`,
                        maxHeight: `${barChartHeight}px`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels */}
            <div className="flex justify-between px-2 mt-3">
              {monthlyTrend.map((item) => (
                <div
                  key={`${item.year}-${item.month}`}
                  className="flex-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400"
                >
                  {MONTH_NAMES[item.month - 1]} '{String(item.year).slice(2)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
