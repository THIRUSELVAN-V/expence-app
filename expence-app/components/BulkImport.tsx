'use client';

import React, { useState } from 'react';
import { X, FileSpreadsheet, AlertCircle, Database, Check } from 'lucide-react';

interface ParsedExpense {
  sNo?: number;
  date: string;
  item: string;
  amount: number;
  description: string;
}

interface BulkImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (expenses: ParsedExpense[], overwrite: boolean) => Promise<void>;
}

export default function BulkImport({ isOpen, onClose, onImport }: BulkImportProps) {
  const [pasteText, setPasteText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedExpense[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const parseExcelDate = (dateStr: string): Date => {
    const clean = dateStr.trim();
    // DD/MMYYYY
    const match1 = clean.match(/^(\d{1,2})\/(\d{1,2})(\d{4})$/);
    if (match1) {
      return new Date(parseInt(match1[3]), parseInt(match1[2]) - 1, parseInt(match1[1]));
    }
    // DD/MM/YYYY
    const match2 = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match2) {
      return new Date(parseInt(match2[3]), parseInt(match2[2]) - 1, parseInt(match2[1]));
    }
    // YYYY-MM-DD or standard parseable dates
    const parsed = Date.parse(clean);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }
    return new Date();
  };

  const handleParse = () => {
    setError('');
    setSuccess(false);

    if (!pasteText.trim()) {
      setParsedData([]);
      return;
    }

    try {
      const lines = pasteText.split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('Please include a header row and at least one data row.');
      }

      // Check header matches
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split('\t');
      
      const sNoIdx = headers.findIndex(h => h.includes('s.no') || h.includes('no') || h.includes('sno'));
      const dateIdx = headers.findIndex(h => h.includes('date'));
      const itemIdx = headers.findIndex(h => h.includes('item'));
      const rsIdx = headers.findIndex(h => h.includes('rs') || h.includes('amount') || h.includes('price'));
      const descIdx = headers.findIndex(h => h.includes('disc') || h.includes('desc'));

      if (itemIdx === -1 && rsIdx === -1) {
        throw new Error('Could not find "item" or "Rs" columns. Please verify columns are separated by tabs (Excel format).');
      }

      const results: ParsedExpense[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cells = lines[i].split('\t');
        
        // Skip totals rows
        const isTotalRow = cells.some(c => c.toLowerCase().includes('total'));
        if (isTotalRow) continue;

        const item = itemIdx !== -1 ? cells[itemIdx]?.trim() : '';
        const amountStr = rsIdx !== -1 ? cells[rsIdx]?.trim() : '';

        // Skip blank lines
        if (!item && !amountStr) continue;

        const sNo = sNoIdx !== -1 ? parseInt(cells[sNoIdx]?.trim(), 10) : undefined;
        const dateStr = dateIdx !== -1 ? cells[dateIdx]?.trim() : '';
        const description = descIdx !== -1 ? cells[descIdx]?.trim() : '';
        
        const cleanAmountStr = amountStr.replace(/[^0-9.]/g, '');
        const amount = parseFloat(cleanAmountStr);

        results.push({
          sNo: isNaN(sNo as number) ? undefined : sNo,
          date: dateStr ? parseExcelDate(dateStr).toISOString() : new Date().toISOString(),
          item: item || 'Unnamed Item',
          amount: isNaN(amount) ? 0 : amount,
          description: description || '',
        });
      }

      if (results.length === 0) {
        throw new Error('No valid rows found to import.');
      }

      setParsedData(results);
    } catch (err: any) {
      setError(err?.message || 'Failed to parse text. Make sure it is copied directly from Excel.');
      setParsedData([]);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);
    setError('');
    try {
      await onImport(parsedData, overwrite);
      setSuccess(true);
      setPasteText('');
      setParsedData([]);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Error uploading data. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const totalSum = parsedData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-950 flex flex-col max-h-[85vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <FileSpreadsheet className="h-6 w-6 text-violet-600" />
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            Bulk Import from Excel
          </h2>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>Import completed successfully!</span>
          </div>
        )}

        {/* Importer Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Copy rows directly from your Excel spreadsheet (including headers) and paste them here. Columns must include <code className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">Date</code>, <code className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">item</code>, and <code className="bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">Rs</code>.
          </p>

          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onBlur={handleParse}
            placeholder={`s.no\tDate\titem\tRs\tdiscription\n37\t07/062026\tdosa mav\t10\t40\n36\t07/062026\tdosa pan\t162.5\t650/4=162.5`}
            rows={6}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs font-mono text-zinc-900 outline-none transition focus:border-violet-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white dark:focus:border-violet-500 dark:focus:bg-zinc-950"
          />

          <div className="flex justify-between items-center">
            <button
              onClick={handleParse}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:bg-violet-950/30 dark:hover:bg-violet-950/50 transition"
            >
              Parse / Preview Data
            </button>

            {parsedData.length > 0 && (
              <div className="text-right">
                <span className="text-xs font-medium text-zinc-500 mr-4">
                  Parsed: <strong>{parsedData.length}</strong> items
                </span>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Total: <strong>₹{totalSum.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Parsed Live Preview Table */}
          {parsedData.length > 0 && (
            <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 font-semibold text-zinc-600 dark:text-zinc-400">
                  <tr>
                    <th className="p-2 border-b border-zinc-100 dark:border-zinc-800">S.No</th>
                    <th className="p-2 border-b border-zinc-100 dark:border-zinc-800">Date</th>
                    <th className="p-2 border-b border-zinc-100 dark:border-zinc-800">Item</th>
                    <th className="p-2 border-b border-zinc-100 dark:border-zinc-800 text-right">Rs</th>
                    <th className="p-2 border-b border-zinc-100 dark:border-zinc-800">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-700 dark:text-zinc-300">
                  {parsedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                      <td className="p-2 font-mono">{row.sNo || '-'}</td>
                      <td className="p-2">{new Date(row.date).toLocaleDateString('en-GB')}</td>
                      <td className="p-2 font-medium">{row.item}</td>
                      <td className="p-2 text-right font-mono">₹{row.amount.toFixed(2)}</td>
                      <td className="p-2 max-w-[150px] truncate text-zinc-400">{row.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Database behavior check */}
          {parsedData.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3 mt-4">
              <Database className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                  Database Upload Settings
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                    Clear previous expenses database before uploading (Full Overwrite)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleImportSubmit}
            disabled={parsedData.length === 0 || loading}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-indigo-200 dark:shadow-none transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Uploading Data...' : `Upload ${parsedData.length} Items`}
          </button>
        </div>
      </div>
    </div>
  );
}
