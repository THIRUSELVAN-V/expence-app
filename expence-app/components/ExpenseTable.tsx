'use client';

import React, { useState } from 'react';
import { Edit2, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, HelpCircle, Eye } from 'lucide-react';

interface Expense {
  _id?: string;
  sNo?: number;
  date: string;
  item: string;
  amount: number;
  description?: string;
  category: string;
}

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

type SortField = 'sNo' | 'date' | 'item' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Housing: 'bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  Transport: 'bg-red-50 text-red-700 border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
  'Snacks & Drinks': 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Others: 'bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
};

const ITEMS_PER_PAGE = 10;

export default function ExpenseTable({ expenses, onEdit, onDelete, loading }: ExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDetailsId, setActiveDetailsId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'sNo') {
      const numA = valA !== undefined ? (valA as number) : -1;
      const numB = valB !== undefined ? (valB as number) : -1;
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    }

    if (sortField === 'date') {
      const dateA = new Date(valA as string).getTime();
      const dateB = new Date(valB as string).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // String comparison
    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    
    if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
    if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate expenses
  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = sortedExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />;
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950 overflow-hidden">
      {/* Table grid wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-zinc-50/75 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th
                onClick={() => handleSort('sNo')}
                className="p-4 cursor-pointer select-none transition hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 font-mono w-16"
              >
                <div className="flex items-center">S.No <SortIcon field="sNo" /></div>
              </th>
              <th
                onClick={() => handleSort('date')}
                className="p-4 cursor-pointer select-none transition hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-center">Date <SortIcon field="date" /></div>
              </th>
              <th
                onClick={() => handleSort('item')}
                className="p-4 cursor-pointer select-none transition hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-center">Item <SortIcon field="item" /></div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="p-4 cursor-pointer select-none transition hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-center">Category <SortIcon field="category" /></div>
              </th>
              <th
                onClick={() => handleSort('amount')}
                className="p-4 cursor-pointer select-none text-right transition hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex items-center justify-end">Amount <SortIcon field="amount" /></div>
              </th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-2 w-2 animate-ping rounded-full bg-violet-600" />
                    <span>Loading expenses list...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-16 text-center text-zinc-400">
                  No records matching search filters found
                </td>
              </tr>
            ) : (
              paginatedExpenses.map((expense) => {
                const isDetailsActive = activeDetailsId === expense._id;
                return (
                  <React.Fragment key={expense._id}>
                    <tr className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/10 transition duration-150">
                      <td className="p-4 font-mono font-medium text-zinc-400">
                        {expense.sNo || '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {new Date(expense.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-4 font-semibold text-zinc-950 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{expense.item}</span>
                          {expense.description && (
                            <button
                              onClick={() => setActiveDetailsId(isDetailsActive ? null : expense._id || null)}
                              title="View description notes"
                              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          CATEGORY_COLORS[expense.category] || 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-zinc-950 dark:text-white">
                        ₹{expense.amount.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            onClick={() => onEdit(expense)}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-violet-600 dark:hover:bg-zinc-900 dark:hover:text-violet-400 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => expense._id && onDelete(expense._id)}
                            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-900 dark:hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isDetailsActive && expense.description && (
                      <tr className="bg-zinc-50/50 dark:bg-zinc-900/10">
                        <td colSpan={6} className="px-6 py-3 border-t-0 text-xs text-zinc-500 dark:text-zinc-400">
                          <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-[10px] block mb-1">
                              Note/Calculation Details:
                            </span>
                            {expense.description}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/30 dark:bg-zinc-900/10">
          <span className="text-xs text-zinc-400">
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-1.5 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 transition disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-1.5 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300 transition disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
