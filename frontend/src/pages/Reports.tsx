import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Calendar, 
  RefreshCw,
  SlidersHorizontal,
  Eye
} from 'lucide-react';
import { reportsService } from '../services/reports';

const Reports: React.FC = () => {
  const [rangeType, setRangeType] = useState('month');
  const [customRange, setCustomRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      let start = '';
      let end = '';
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (rangeType === 'today') {
        start = todayStr;
        end = todayStr;
      } else if (rangeType === 'month') {
        start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        // simple end date matching SQLite
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (rangeType === 'yearly') {
        start = `${today.getFullYear()}-01-01`;
        end = `${today.getFullYear()}-12-31`;
      } else if (rangeType === 'custom') {
        start = customRange.start_date;
        end = customRange.end_date;
      }
      
      if (!start || !end) return;
      
      const res = await reportsService.getFinancial({ start_date: start, end_date: end });
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError('Failed to compute profit and loss statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReport();
  }, [rangeType]);

  const handleCustomRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFinancialReport();
  };

  const handleExportPdf = async () => {
    try {
      const params: any = { range_type: rangeType };
      if (rangeType === 'custom') {
        params.start_date = customRange.start_date;
        params.end_date = customRange.end_date;
      }
      await reportsService.downloadFinancialReport(params);
    } catch (err) {
      console.error('Error downloading statement', err);
    }
  };

  const handleViewPdf = async () => {
    try {
      const params: any = { range_type: rangeType };
      if (rangeType === 'custom') {
        params.start_date = customRange.start_date;
        params.end_date = customRange.end_date;
      }
      await reportsService.viewFinancialReport(params);
    } catch (err) {
      console.error('Error viewing statement', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val).replace('INR', 'Rs.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">Generate dynamic Profit & Loss statements and export statements as PDFs</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={handleViewPdf}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl transition cursor-pointer text-sm"
          >
            <Eye size={16} className="stroke-[2.5]" /> View Statement
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/10 cursor-pointer text-sm"
          >
            <FileDown size={16} className="stroke-[2.5]" /> Export Statement PDF
          </button>
        </div>
      </div>

      {/* Period Selection Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'today', name: "Today's summary" },
            { id: 'month', name: 'This Month' },
            { id: 'yearly', name: 'This Year' },
            { id: 'custom', name: 'Custom Range' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setRangeType(opt.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                rangeType === opt.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>

        {rangeType === 'custom' && (
          <form onSubmit={handleCustomRangeSubmit} className="flex flex-wrap items-end gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/40 dark:border-slate-800/40 animate-in fade-in duration-150 text-left">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
              <input
                type="date"
                required
                value={customRange.start_date}
                onChange={e => setCustomRange({ ...customRange, start_date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 dark:text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
              <input
                type="date"
                required
                value={customRange.end_date}
                onChange={e => setCustomRange({ ...customRange, end_date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer"
            >
              <SlidersHorizontal size={12} /> Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* PROFIT & LOSS CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
          <RefreshCw className="animate-spin text-amber-500" size={24} />
          <p className="text-slate-500 font-semibold text-xs">Computing ledger values...</p>
        </div>
      ) : error || !data ? (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400">
          <p className="font-bold">{error || 'An error occurred.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profit & Loss Statement */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6 text-left">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Profit & Loss Statement Ledger</h2>
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Calendar size={12} /> {data.period.start} to {data.period.end}
              </span>
            </div>

            {/* Income Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Revenue (Income)</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Hourly Rental Jobs Billing</span>
                  <span className="font-bold">{formatCurrency(data.income.hourly)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Loading Trips Jobs Billing</span>
                  <span className="font-bold">{formatCurrency(data.income.loading)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 text-emerald-600 dark:text-emerald-400">
                  <span>Gross Operating Revenue</span>
                  <span>{formatCurrency(data.income.total)}</span>
                </div>
              </div>
            </div>

            {/* Operating Expenses Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Operating Expenses</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Job Expense: Food & Bata (Allowance)</span>
                  <span className="font-semibold">{formatCurrency(data.expenses.job_food + data.expenses.job_bata)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Job Expense: Job Diesel Consumed</span>
                  <span className="font-semibold">{formatCurrency(data.expenses.job_diesel)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Job Expense: Additional & Other Charges</span>
                  <span className="font-semibold">{formatCurrency(data.expenses.job_additional + data.expenses.job_other)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Direct Driver Cash Payments</span>
                  <span className="font-semibold">{formatCurrency(data.expenses.driver_payments)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-850">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Bulk Fuel Purchases ({data.expenses.fuel_litres.toFixed(1)} Litres)</span>
                  <span className="font-semibold">{formatCurrency(data.expenses.fuel_purchases)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 text-rose-600 dark:text-rose-400">
                  <span>Total Operating Expenses</span>
                  <span>{formatCurrency(data.expenses.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white dark:bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm text-left flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Statement Profit</span>
                <p className={`text-3xl font-black mt-3 ${
                  data.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(data.net_profit)}
                </p>
                <p className="text-xs text-slate-400 font-semibold mt-2">
                  Net earnings computed after subtracting direct vehicle operating expenses, helper pay, and bulk fuel logs.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                <span>Income: {formatCurrency(data.income.total)}</span>
                <span>•</span>
                <span>Expenses: {formatCurrency(data.expenses.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
