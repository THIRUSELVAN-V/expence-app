/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Upload, Database, RefreshCw, Search, Calendar, Tag, ShieldAlert } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import ExpenseCharts from '@/components/ExpenseCharts';
import ExpenseTable from '@/components/ExpenseTable';
import ExpenseForm from '@/components/ExpenseForm';
import BulkImport from '@/components/BulkImport';

const cleanApiUrl = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '') 
  : 'http://localhost:5000';

const API_BASE_URL = `${cleanApiUrl}/api/expenses`;

interface Expense {
  _id?: string;
  sNo?: number;
  date: string;
  item: string;
  amount: number;
  description?: string;
  category: string;
}

interface Stats {
  totalSpent: number;
  totalCount: number;
  categoryBreakdown: Array<{ category: string; total: number; count: number }>;
  monthlyTrend: Array<{ year: number; month: number; total: number }>;
  highestExpense: Expense | null;
}

// Sample data for easy initial seeding
const SAMPLE_EXPENSES = [
  { sNo: 37, date: '2026-06-07T00:00:00.000Z', item: 'dosa mav', amount: 10, description: '40' },
  { sNo: 36, date: '2026-06-07T00:00:00.000Z', item: 'dosa pan', amount: 162.5, description: '650/4=162.5' },
  { sNo: 35, date: '2026-06-07T00:00:00.000Z', item: 'snacks', amount: 25, description: 'tea,variki,buiscket' },
  { sNo: 34, date: '2026-06-07T00:00:00.000Z', item: 'kodiveri expense', amount: 110, description: 'mango,lemonsoda,colyflower,sugercan juice' },
  { sNo: 33, date: '2026-06-07T00:00:00.000Z', item: 'breakfast', amount: 30, description: '2dosa' },
  { sNo: 32, date: '2026-06-06T00:00:00.000Z', item: 'tilo', amount: 10, description: '' },
  { sNo: 31, date: '2026-06-06T00:00:00.000Z', item: 'dinner', amount: 50, description: '2parota' },
  { sNo: 30, date: '2026-06-06T00:00:00.000Z', item: 'breakfast', amount: 25, description: '1idly,1dosa' },
  { sNo: 29, date: '2026-06-05T00:00:00.000Z', item: 'dinner', amount: 25, description: '1dosa,1idly' },
  { sNo: 28, date: '2026-06-05T00:00:00.000Z', item: 'kodam and clean sitck', amount: 40, description: '' },
  { sNo: 27, date: '2026-06-05T00:00:00.000Z', item: 'dinner', amount: 30, description: '2dosa' },
  { sNo: 26, date: '2026-06-05T00:00:00.000Z', item: 'snacks', amount: 25, description: 'mushroom puff' },
  { sNo: 25, date: '2026-06-05T00:00:00.000Z', item: 'breakfast', amount: 25, description: '1dasa,1idly' },
  { sNo: 24, date: '2026-06-04T00:00:00.000Z', item: 'dinner', amount: 40, description: '1rost' },
  { sNo: 23, date: '2026-06-04T00:00:00.000Z', item: 'house things ', amount: 812, description: 'house things amount (navani)' },
  { sNo: 22, date: '2026-06-04T00:00:00.000Z', item: 'house advance', amount: 4000, description: '' },
  { sNo: 21, date: '2026-06-04T00:00:00.000Z', item: 'snacks', amount: 10, description: 'burbun buisket' },
  { sNo: 20, date: '2026-06-04T00:00:00.000Z', item: 'cofee', amount: 15, description: '' },
  { sNo: 19, date: '2026-06-04T00:00:00.000Z', item: 'breakfast', amount: 25, description: '1dosa,1idly' },
  { sNo: 18, date: '2026-06-03T00:00:00.000Z', item: 'bloom stick', amount: 28, description: '140 (28 per person)' },
  { sNo: 17, date: '2026-06-03T00:00:00.000Z', item: 'milk buisket', amount: 10, description: '' },
  { sNo: 16, date: '2026-06-03T00:00:00.000Z', item: 'panipori', amount: 35, description: '' },
  { sNo: 15, date: '2026-06-03T00:00:00.000Z', item: 'snacks', amount: 80, description: '' },
  { sNo: 14, date: '2026-06-03T00:00:00.000Z', item: '4R to clg', amount: 6, description: '' },
  { sNo: 13, date: '2026-06-03T00:00:00.000Z', item: 'lunch', amount: 30, description: '2chapathi' },
  { sNo: 12, date: '2026-06-03T00:00:00.000Z', item: 'break fast', amount: 35, description: '2idly,2dosa' },
  { sNo: 11, date: '2026-06-02T00:00:00.000Z', item: 'dinner', amount: 25, description: '1idly,1dosa' },
  { sNo: 10, date: '2026-06-02T00:00:00.000Z', item: 'buds', amount: 30, description: '' },
  { sNo: 9, date: '2026-06-02T00:00:00.000Z', item: 'tea', amount: 13, description: '' },
  { sNo: 8, date: '2026-06-02T00:00:00.000Z', item: 'lunch', amount: 80, description: 'kothu parota' },
  { sNo: 7, date: '2026-06-02T00:00:00.000Z', item: 'auto charge', amount: 150, description: 'for vecate (want to give to nithish)' },
  { sNo: 6, date: '2026-06-01T00:00:00.000Z', item: 'juice', amount: 60, description: '' },
  { sNo: 5, date: '2026-06-01T00:00:00.000Z', item: '4road-clg ticket', amount: 21, description: '' },
  { sNo: 4, date: '2026-06-01T00:00:00.000Z', item: 'dinner', amount: 35, description: '1dosa,1parota (want to give to nithish)' },
  { sNo: 3, date: '2026-06-01T00:00:00.000Z', item: 'tea', amount: 10, description: '(want to give to nithish)' },
  { sNo: 2, date: '2026-06-01T00:00:00.000Z', item: 'house things', amount: 784, description: 'bought fan and related things (784 per person)' },
  { sNo: 1, date: '2026-05-18T00:00:00.000Z', item: 'House advance', amount: 1000, description: 'given 1000 out of 5000' }
];

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSpent: 0,
    totalCount: 0,
    categoryBreakdown: [],
    monthlyTrend: [],
    highestExpense: null,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Expenses
  const fetchExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`${API_BASE_URL}?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch expenses list');
      const data = await res.json();
      setExpenses(data);
    } catch (err: any) {
      setError(err?.message || 'Failed connecting to server');
    }
  }, [search, category, startDate, endDate]);

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      if (!res.ok) throw new Error('Failed to fetch statistics');
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
    }
  }, []);

  // Fetch API on component mount and filter change
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(async () => {
      await Promise.all([fetchExpenses(), fetchStats()]);
      setLoading(false);
    }, 300); // Debounce fetch responses slightly

    return () => clearTimeout(timeout);
  }, [fetchExpenses, fetchStats]);

  // Reset Filters helper
  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setStartDate('');
    setEndDate('');
  };

  // Add / Edit expense handler
  const handleFormSubmit = async (expenseData: Partial<Expense>) => {
    const isEdit = !!expenseData._id;
    const url = isEdit ? `${API_BASE_URL}/${expenseData._id}` : API_BASE_URL;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expenseData),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.message || 'Failed saving expense');
    }

    await Promise.all([fetchExpenses(), fetchStats()]);
  };

  // Delete expense handler
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed deleting expense');
      await Promise.all([fetchExpenses(), fetchStats()]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Bulk Import handler
  const handleBulkImport = async (parsedExpenses: any[], overwrite: boolean) => {
    const res = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses: parsedExpenses, overwrite }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData?.message || 'Failed to bulk import data');
    }

    await Promise.all([fetchExpenses(), fetchStats()]);
  };

  // Auto Seeding with default data
  const handleSeeding = async () => {
    if (!confirm('This will load all 37 sample transactions from your original sheet. Proceed?')) return;
    setActionLoading(true);
    try {
      await handleBulkImport(SAMPLE_EXPENSES, true);
      alert('Database seeded successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const averageSpend = stats.totalCount > 0 ? (stats.totalSpent / stats.totalCount).toFixed(2) : '0.00';

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 transition-colors pb-16">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 dark:border-zinc-800/80 dark:bg-black/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              ₹
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              Expense Tracker
            </h1>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={handleSeeding}
              disabled={actionLoading}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50 transition cursor-pointer disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              <span>Seed Sample Data</span>
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50 transition cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={() => {
                setEditExpense(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-indigo-200 dark:shadow-none transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="mx-auto max-w-6xl px-6 mt-6">
          <div className="bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30 rounded-2xl p-4 flex gap-3 items-center text-red-700 dark:text-red-400 text-sm font-semibold">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              Backend Server Offline. Make sure you run <code className="bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded font-mono">npm run dev</code> in the backend directory.
            </div>
            <button
              onClick={fetchExpenses}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-xs transition border border-red-200 dark:border-red-800"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Primary Dashboard Container */}
      <div className="mx-auto max-w-6xl px-6 mt-8 space-y-6">
        {/* Analytics Summary Metric Cards */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Expense"
            value={`₹${stats.totalSpent.toLocaleString('en-IN')}`}
            subtext={`${stats.totalCount} Recorded entries`}
            icon={<span className="text-xl font-bold">₹</span>}
            gradient="from-violet-600 to-indigo-600"
          />
          <MetricCard
            title="Average Item Cost"
            value={`₹${parseFloat(averageSpend).toLocaleString('en-IN')}`}
            subtext="Weighted average per transaction"
            icon={<span className="text-xl font-bold">~</span>}
            gradient="from-amber-500 to-orange-500"
          />
          <MetricCard
            title="Highest Expense"
            value={stats.highestExpense ? `₹${stats.highestExpense.amount.toLocaleString('en-IN')}` : '₹0.00'}
            subtext={stats.highestExpense ? stats.highestExpense.item : 'No entries'}
            icon={<span className="text-xl font-bold">↑</span>}
            gradient="from-red-500 to-pink-500"
          />
          <MetricCard
            title="Transactions count"
            value={stats.totalCount}
            subtext="Completed entries"
            icon={<span className="text-xl font-bold">#</span>}
            gradient="from-emerald-500 to-teal-500"
          />
        </section>

        {/* Visual Charts */}
        <section>
          <ExpenseCharts
            categoryBreakdown={stats.categoryBreakdown}
            monthlyTrend={stats.monthlyTrend}
            expenses={expenses}
            onEdit={(exp) => {
              setEditExpense(exp);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        </section>

        {/* Filters and Search toolbar */}
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expense item or description..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950"
              />
            </div>

            {/* Filters selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:w-[60%]">
              {/* Category */}
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 py-2 text-xs text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950 appearance-none"
                >
                  <option value="">All Categories</option>
                  <option value="Food">Food</option>
                  <option value="Housing">Housing</option>
                  <option value="Transport">Transport</option>
                  <option value="Snacks & Drinks">Snacks & Drinks</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 py-2 text-xs text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500"
                />
              </div>

              {/* End Date */}
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-9 pr-3 py-2 text-xs text-zinc-700 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500"
                />
              </div>

              {/* Reset */}
              <button
                onClick={handleResetFilters}
                className="rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white transition font-semibold text-xs py-2 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {/* Database Table list */}
        <section>
          <ExpenseTable
            expenses={expenses}
            onEdit={(exp) => {
              setEditExpense(exp);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
            loading={loading}
          />
        </section>
      </div>

      {/* Modals & Slide-overs */}
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditExpense(null);
        }}
        onSubmit={handleFormSubmit}
        editExpense={editExpense}
      />

      <BulkImport
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
      />
    </main>
  );
}
