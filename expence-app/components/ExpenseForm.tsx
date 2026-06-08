'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Tag, AlignLeft, ShoppingBag } from 'lucide-react';

interface Expense {
  _id?: string;
  sNo?: number;
  date: string;
  item: string;
  amount: number;
  description?: string;
  category?: string;
}

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expenseData: Partial<Expense>) => Promise<void>;
  editExpense?: Expense | null;
}

const CATEGORIES = ['Food', 'Housing', 'Transport', 'Snacks & Drinks', 'Others'];

export default function ExpenseForm({ isOpen, onClose, onSubmit, editExpense }: ExpenseFormProps) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editExpense) {
      setItem(editExpense.item);
      setAmount(String(editExpense.amount));
      // Parse ISO date string to YYYY-MM-DD
      const expDate = new Date(editExpense.date);
      const formattedDate = expDate.toISOString().split('T')[0];
      setDate(formattedDate);
      setDescription(editExpense.description || '');
      setCategory(editExpense.category || '');
    } else {
      setItem('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setCategory('');
    }
    setError('');
  }, [editExpense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.trim()) return setError('Item name is required');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return setError('Please enter a valid amount greater than 0');
    }
    if (!date) return setError('Date is required');

    setLoading(true);
    setError('');

    try {
      const data: Partial<Expense> = {
        item: item.trim(),
        amount: Number(amount),
        date: new Date(date).toISOString(),
        description: description.trim(),
        category: category || undefined, // Send undefined to trigger backend auto-categorization
      };

      if (editExpense?._id) {
        data._id = editExpense._id;
        data.sNo = editExpense.sNo;
      }

      await onSubmit(data);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white mb-6">
          {editExpense ? 'Edit Expense Details' : 'Record New Expense'}
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-zinc-400" /> Item Name
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="e.g. Dosa Pan, Tea, Auto Charge"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950"
              required
            />
          </div>

          {/* Amount (Rs) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-zinc-400" /> Amount (₹)
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-zinc-400" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-zinc-400" /> Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950"
            >
              <option value="">Auto Detect (Based on Item name)</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <AlignLeft className="h-4 w-4 text-zinc-400" /> Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. split between roommates, 2 idly 1 dosa"
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-indigo-200 dark:shadow-none transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : editExpense ? 'Update' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
