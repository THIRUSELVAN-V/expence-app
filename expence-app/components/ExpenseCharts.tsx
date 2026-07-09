'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, X, Edit2, Trash2, TrendingUp } from 'lucide-react';

interface Expense {
  _id?: string;
  sNo?: number;
  date: string;
  item: string;
  amount: number;
  description?: string;
  category: string;
}

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
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
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

const CATEGORY_COLORS_TABLE: Record<string, string> = {
  Food: 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Housing: 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Transport: 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  'Snacks & Drinks': 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Others: 'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function ExpenseCharts({
  expenses,
  onEdit,
  onDelete,
}: ExpenseChartsProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  
  // Selected month filter
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');
  
  // Selected day string (e.g. '2026-06-07')
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  // 1. Extract unique months from expenses list
  const uniqueMonths = useMemo(() => {
    const monthsMap: Record<string, { year: number; month: number; label: string }> = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      monthsMap[key] = { year, month, label };
    });
    return Object.entries(monthsMap)
      .sort((a, b) => b[0].localeCompare(a[0])) // Descending order (recent first)
      .map(([key, val]) => ({ key, ...val }));
  }, [expenses]);

  // Derive selectedDayData dynamically
  const selectedDayData = useMemo(() => {
    if (!selectedDayString) return null;
    const dayExpenses = expenses.filter(
      (exp) => exp.date.split('T')[0] === selectedDayString
    );
    if (dayExpenses.length === 0) return null;
    return {
      dateString: selectedDayString,
      dateLabel: new Date(selectedDayString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      expenses: dayExpenses,
    };
  }, [expenses, selectedDayString]);

  // 2. Filter expenses for the active month selection
  const activeExpenses = useMemo(() => {
    if (selectedMonthKey === 'all') return expenses;
    const [year, month] = selectedMonthKey.split('-').map(Number);
    return expenses.filter((exp) => {
      const d = new Date(exp.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  }, [expenses, selectedMonthKey]);

  // 3. Compute Category breakdown dynamically
  const activeCategoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { total: number; count: number }> = {};
    activeExpenses.forEach((exp) => {
      const cat = exp.category || 'Others';
      if (!breakdown[cat]) {
        breakdown[cat] = { total: 0, count: 0 };
      }
      breakdown[cat].total += exp.amount;
      breakdown[cat].count += 1;
    });
    return Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [activeExpenses]);

  // 4. Compute Monthly spend trend dynamically (reacts to table filter changes)
  const computedMonthlyTrend = useMemo(() => {
    const trendMap: Record<string, { year: number; month: number; total: number }> = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (isNaN(d.getTime())) return;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${month}`;
      if (!trendMap[key]) {
        trendMap[key] = { year, month, total: 0 };
      }
      trendMap[key].total += exp.amount;
    });
    return Object.values(trendMap).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [expenses]);

  // 5. Compute Daily data points for the selected month/period
  const daysInMonth = useMemo(() => {
    if (selectedMonthKey === 'all') return 30; // standard fallback
    const [year, month] = selectedMonthKey.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonthKey]);

  const dailyData = useMemo(() => {
    if (selectedMonthKey !== 'all') {
      const [year, month] = selectedMonthKey.split('-').map(Number);
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const dataMap: Record<number, Expense[]> = {};
      days.forEach((d) => {
        dataMap[d] = [];
      });
      activeExpenses.forEach((exp) => {
        const d = new Date(exp.date);
        const day = d.getDate();
        if (dataMap[day]) {
          dataMap[day].push(exp);
        }
      });
      return days.map((day) => {
        const items = dataMap[day] || [];
        const total = items.reduce((sum, item) => sum + item.amount, 0);
        const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return {
          dayLabel: String(day),
          dateString: formattedDate,
          total,
          expenses: items,
        };
      });
    } else {
      // All time selected: show last 30 active calendar days
      if (expenses.length === 0) return [];
      const datesList = expenses
        .map((e) => new Date(e.date).getTime())
        .filter((t) => !isNaN(t));
      if (datesList.length === 0) return [];
      
      const mostRecentDate = new Date(Math.max(...datesList));
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(mostRecentDate);
        d.setDate(mostRecentDate.getDate() - (29 - i));
        return d;
      });
      
      const dataMap: Record<string, Expense[]> = {};
      days.forEach((d) => {
        const key = d.toISOString().split('T')[0];
        dataMap[key] = [];
      });
      expenses.forEach((exp) => {
        const key = exp.date.split('T')[0];
        if (dataMap[key]) {
          dataMap[key].push(exp);
        }
      });
      return days.map((d) => {
        const key = d.toISOString().split('T')[0];
        const items = dataMap[key] || [];
        const total = items.reduce((sum, item) => sum + item.amount, 0);
        return {
          dayLabel: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          dateString: key,
          total,
          expenses: items,
        };
      });
    }
  }, [activeExpenses, expenses, selectedMonthKey, daysInMonth]);

  // Donut chart calculations
  const totalCategorySpend = activeCategoryBreakdown.reduce((sum, item) => sum + item.total, 0);
  
  const donutSegments = useMemo(() => {
    const segments = [];
    let accumulatedAngle = 0;
    for (let i = 0; i < activeCategoryBreakdown.length; i++) {
      const item = activeCategoryBreakdown[i];
      const percentage = totalCategorySpend > 0 ? (item.total / totalCategorySpend) * 100 : 0;
      const angle = totalCategorySpend > 0 ? (item.total / totalCategorySpend) * 360 : 0;
      const startAngle = accumulatedAngle;
      accumulatedAngle += angle;
      segments.push({
        category: item.category,
        total: item.total,
        percentage,
        startAngle,
        angle,
        color: CATEGORY_COLORS[item.category] || '#6B7280',
      });
    }
    return segments;
  }, [activeCategoryBreakdown, totalCategorySpend]);

  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Monthly trend bar chart values
  const maxTrendSpend = computedMonthlyTrend.reduce((max, item) => Math.max(max, item.total), 0) || 1;
  const barChartHeight = 160;

  // Daily trend line values
  const maxDailySpend = Math.max(...dailyData.map((d) => d.total), 0) || 1;
  const width = 600;
  const height = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  
  const points = useMemo(() => {
    if (dailyData.length === 0) return [];
    return dailyData.map((d, i) => {
      const x = padLeft + (i / (dailyData.length - 1)) * chartWidth;
      const y = height - padBottom - (d.total / maxDailySpend) * chartHeight;
      return { x, y, ...d };
    });
  }, [dailyData, maxDailySpend, chartWidth, chartHeight]);

  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    return `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;
  }, [points, linePath]);

  const labelInterval = useMemo(() => {
    return Math.max(Math.floor(dailyData.length / 7), 1);
  }, [dailyData.length]);

  return (
    <div className="space-y-6">
      {/* Navigation Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white">
              Visual Analytics
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Interactive insights on category distribution, monthly and daily spending trends.
            </p>
          </div>
        </div>

        {/* Month Selector dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-semibold dark:text-zinc-400">Active Filter:</span>
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-8 py-2 text-xs font-semibold text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              {uniqueMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 pointer-events-none text-[8px] text-zinc-400">
              ▼
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown (Donut Chart) */}
        <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Category Distribution
            </h3>
            {selectedMonthKey !== 'all' && (
              <span className="text-xs font-semibold text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400 px-2.5 py-0.5 rounded-full border border-violet-100 dark:border-violet-900/30">
                {uniqueMonths.find((m) => m.key === selectedMonthKey)?.label.split(' ')[0]}
              </span>
            )}
          </div>
          
          {totalCategorySpend === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-zinc-400">
              No spending data for this period
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
                        strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
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
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        {hoveredCategory}
                      </span>
                      <span className="text-base font-extrabold text-zinc-900 dark:text-white mt-0.5 font-mono">
                        ₹{donutSegments.find((s) => s.category === hoveredCategory)?.total.toLocaleString('en-IN') || 0}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {donutSegments.find((s) => s.category === hoveredCategory)?.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Active Spend
                      </span>
                      <span className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 font-mono">
                        ₹{totalCategorySpend.toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2.5 justify-center">
                {donutSegments.map((seg) => (
                  <div
                    key={seg.category}
                    className={`flex items-center gap-3 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      hoveredCategory === seg.category
                        ? 'bg-zinc-50 dark:bg-zinc-900'
                        : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50'
                    }`}
                    onMouseEnter={() => setHoveredCategory(seg.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${CATEGORY_TAILWIND_BG[seg.category] || 'bg-gray-500'}`} />
                    <div className="flex flex-col min-w-[90px]">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-none">
                        {seg.category}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-900 dark:text-white font-mono mt-0.5">
                        ₹{seg.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-semibold ml-auto pl-2">
                      {seg.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Spend Trend (Bar Chart) */}
        <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
              Monthly Trend
            </h3>
            <span className="text-xs text-zinc-400">Click bar to select month</span>
          </div>

          {computedMonthlyTrend.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-zinc-400">
              No trend data available
            </div>
          ) : (
            <div className="flex flex-col justify-between flex-1">
              <div className="relative flex items-end justify-between h-[160px] px-2 pt-4 border-b border-zinc-100 dark:border-zinc-800">
                {/* Vertical Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 text-[10px] text-zinc-400">
                  <div className="border-t border-zinc-100 dark:border-zinc-900/50 w-full" />
                  <div className="border-t border-zinc-100 dark:border-zinc-900/50 w-full" />
                  <div className="border-t border-zinc-100 dark:border-zinc-900/50 w-full" />
                </div>

                {computedMonthlyTrend.map((item, idx) => {
                  const percentHeight = (item.total / maxTrendSpend) * 100;
                  const isHovered = hoveredTrendIndex === idx;
                  const itemKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
                  const isSelected = selectedMonthKey === itemKey;

                  return (
                    <div
                      key={itemKey}
                      className="group relative flex flex-col items-center flex-1 mx-2"
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                      onClick={() => setSelectedMonthKey(itemKey)}
                    >
                      {/* Tooltip */}
                      <div
                        className={`absolute -top-10 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md transition-opacity pointer-events-none z-10 flex flex-col items-center leading-none ${
                          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                      >
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mb-0.5">
                          {MONTH_NAMES[item.month - 1]} &apos;{String(item.year).slice(2)}
                        </span>
                        <span className="font-mono">₹{item.total.toLocaleString('en-IN')}</span>
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full max-w-[28px] rounded-t shadow-sm transition-all duration-300 ease-out origin-bottom cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-t from-violet-600 to-indigo-600 ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-black scale-105'
                            : 'bg-gradient-to-t from-violet-400 to-indigo-400 dark:from-violet-500/80 dark:to-indigo-500/80 hover:from-violet-500 hover:to-indigo-500'
                        }`}
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
                {computedMonthlyTrend.map((item) => {
                  const itemKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
                  const isSelected = selectedMonthKey === itemKey;
                  return (
                    <div
                      key={itemKey}
                      onClick={() => setSelectedMonthKey(itemKey)}
                      className={`flex-1 text-center text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-violet-600 dark:text-violet-400 font-bold'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white'
                      }`}
                    >
                      {MONTH_NAMES[item.month - 1]} &apos;{String(item.year).slice(2)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Spend Trend (Full Width Line/Area Chart) */}
        <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Daily Spending Trend
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {selectedMonthKey === 'all'
                  ? 'Showing daily transactions for the last 30 active days'
                  : `Daily expenses breakdown for ${uniqueMonths.find((m) => m.key === selectedMonthKey)?.label || ''}`}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Click any node to view daily transactions popup</span>
            </div>
          </div>

          {dailyData.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-12 text-zinc-400">
              No daily spending data available
            </div>
          ) : (
            <div className="relative w-full h-[220px]">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Gridlines & Y-Axis Labels */}
                {[0, 0.5, 1].map((ratio, i) => {
                  const y = padTop + ratio * chartHeight;
                  const labelVal = maxDailySpend * (1 - ratio);
                  return (
                    <g key={i} className="opacity-45">
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={width - padRight}
                        y2={y}
                        stroke="#E4E4E7"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        className="dark:stroke-zinc-800"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[9px] font-bold fill-zinc-400 font-mono"
                      >
                        ₹{Math.round(labelVal).toLocaleString('en-IN')}
                      </text>
                    </g>
                  );
                })}
                
                {/* Area below the line */}
                {areaPath && (
                  <path
                    d={areaPath}
                    fill="url(#chartGradient)"
                    className="transition-all duration-300"
                  />
                )}
                
                {/* Line Path */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-300"
                  />
                )}
                
                {/* Highlight Vertical Line on Hover */}
                {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                  <line
                    x1={points[hoveredPointIndex].x}
                    y1={padTop}
                    x2={points[hoveredPointIndex].x}
                    y2={height - padBottom}
                    stroke="#818CF8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}
                
                {/* Day nodes (circles) */}
                {points.map((p, idx) => {
                  const isHovered = hoveredPointIndex === idx;
                  const hasExpenses = p.expenses.length > 0;
                  return (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5.5 : hasExpenses ? 3.5 : 1.5}
                      fill={isHovered ? '#4F46E5' : hasExpenses ? '#6366F1' : '#E4E4E7'}
                      stroke={isHovered ? '#EEF2FF' : hasExpenses ? '#FFFFFF' : 'transparent'}
                      strokeWidth={hasExpenses ? 1.5 : 0}
                      className={`transition-all duration-200 pointer-events-none ${
                        isHovered ? 'dark:stroke-black' : 'dark:stroke-zinc-950'
                      }`}
                    />
                  );
                })}
                
                {/* X-Axis labels */}
                {points.map((p, idx) => {
                  if (idx % labelInterval !== 0 && idx !== points.length - 1) return null;
                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={height - 10}
                      textAnchor="middle"
                      className="text-[9px] font-bold fill-zinc-400"
                    >
                      {p.dayLabel}
                    </text>
                  );
                })}
                
                {/* Hover detection rects */}
                {points.map((p, idx) => {
                  const rectWidth = chartWidth / dailyData.length;
                  return (
                    <rect
                      key={idx}
                      x={p.x - rectWidth / 2}
                      y={padTop}
                      width={rectWidth}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                      onClick={() => {
                        if (p.expenses.length > 0) {
                          setSelectedDayString(p.dateString);
                        }
                      }}
                    />
                  );
                })}
              </svg>

              {/* Embedded Tooltip overlay */}
              {hoveredPointIndex !== null && points[hoveredPointIndex] && (
                <div
                  className="absolute bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-md pointer-events-none z-10 flex flex-col gap-0.5 border border-zinc-700/30 dark:border-zinc-200"
                  style={{
                    left: `${(points[hoveredPointIndex].x / width) * 100}%`,
                    top: `${Math.max((points[hoveredPointIndex].y / height) * 100 - 25, 0)}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-none mb-1">
                    {new Date(points[hoveredPointIndex].dateString).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-sm font-bold font-mono">
                    ₹{points[hoveredPointIndex].total.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap mt-0.5 leading-none">
                    {points[hoveredPointIndex].expenses.length} transaction(s)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Daily Expense Details Modal Pop-up */}
      {selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950 flex flex-col max-h-[85vh]">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedDayString(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Transaction Details
              </span>
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white mt-1">
                {selectedDayData.dateLabel}
              </h2>
              <div className="mt-3 flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/40">
                <span className="text-xs text-zinc-500 font-semibold dark:text-zinc-400">Total Spent Today</span>
                <span className="text-lg font-bold text-zinc-950 dark:text-white font-mono">
                  ₹{selectedDayData.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto pr-1 mt-5 space-y-3 scrollbar-thin">
              {selectedDayData.expenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex flex-col gap-2 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-950 dark:text-white">
                        {expense.item}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        CATEGORY_COLORS_TABLE[expense.category] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}>
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <span className="text-sm font-bold font-mono text-zinc-950 dark:text-white">
                        ₹{expense.amount.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            onEdit(expense);
                            setSelectedDayString(null);
                          }}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 transition cursor-pointer"
                          title="Edit transaction"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (expense._id) {
                              await onDelete(expense._id);
                            }
                          }}
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {expense.description && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/20 leading-relaxed font-normal">
                      {expense.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 mt-4 flex justify-end">
              <button
                onClick={() => setSelectedDayString(null)}
                className="px-4 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
