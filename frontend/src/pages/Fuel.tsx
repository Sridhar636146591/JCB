import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileDown,
  Eye,
  Share2
} from 'lucide-react';
import type { FuelEntry } from '../services/fuel';
import { fuelService } from '../services/fuel';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/UI/Dialog';
import { formatIndianNumberString, parseIndianNumberString } from '../utils/format';

const Fuel: React.FC = () => {
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  // Form states
  const [fuelForm, setFuelForm] = useState({
    id: null as number | null,
    date: '',
    vehicle: 'JCB',
    amount: ''
  });
  const [pdfForm, setPdfForm] = useState({ range_type: 'month', start_date: '', end_date: '' });

  const fetchFuelEntries = async () => {
    try {
      setLoading(true);
      const data = await fuelService.getFuelEntries();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching fuel logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuelEntries();
  }, []);

  const handleOpenAddFuel = () => {
    setFuelForm({
      id: null,
      date: new Date().toISOString().split('T')[0],
      vehicle: 'JCB',
      amount: ''
    });
    setIsFuelModalOpen(true);
  };

  const handleOpenEditFuel = (entry: FuelEntry) => {
    setFuelForm({
      id: entry.id,
      date: entry.date,
      vehicle: entry.vehicle,
      amount: formatIndianNumberString(entry.total_cost?.toString() || '')
    });
    setIsFuelModalOpen(true);
  };

  const handleSaveFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseIndianNumberString(fuelForm.amount);
    
    if (!fuelForm.vehicle || amountNum <= 0) return;
    
    const payload = {
      date: fuelForm.date,
      vehicle: fuelForm.vehicle,
      amount: amountNum
    };
    
    try {
      if (fuelForm.id) {
        await fuelService.editFuelEntry(fuelForm.id, payload);
      } else {
        await fuelService.addFuelEntry(payload);
      }
      fetchFuelEntries();
      setIsFuelModalOpen(false);
    } catch (err) {
      console.error('Error saving fuel log', err);
    }
  };

  const handleDeleteFuel = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this fuel purchase log?')) return;
    try {
      await fuelService.deleteFuelEntry(id);
      fetchFuelEntries();
    } catch (err) {
      console.error('Error deleting fuel log', err);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      await fuelService.downloadFuelReport(pdfForm);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Error downloading fuel report', err);
    }
  };

  const handleViewPdf = async () => {
    try {
      await fuelService.viewFuelReport(pdfForm);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Error viewing fuel report', err);
    }
  };

  const getRangeLabel = () => {
    if (pdfForm.range_type === 'today') return 'Today';
    if (pdfForm.range_type === 'month') return 'This Month';
    if (pdfForm.range_type === 'custom') return `${pdfForm.start_date} to ${pdfForm.end_date}`;
    return 'All Time';
  };

  const handleShareWhatsApp = async () => {
    try {
      const rangeLabel = getRangeLabel();
      const totalFuel = entries.reduce((acc, e) => acc + (e.total_cost || 0), 0);
      let text = `*Sri Lakshmi Narayana Swamy Earth Movers*\n`;
      text += `*Fuel Purchase Report — ${rangeLabel}*\n\n`;
      text += `Total Entries: ${entries.length}\n`;
      text += `Total Fuel Spend: Rs. ${totalFuel.toLocaleString('en-IN')}\n\n`;
      text += `For queries contact: *ASHOK G* | +91 9845174737`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Error sharing on WhatsApp', err);
    }
  };

  // Math helpers
  const totalCost = entries.reduce((acc, curr) => acc + (curr.total_cost || 0), 0);
  const totalLogs = entries.length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Fuel Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">Track fleet refueling expenses and spend totals</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <FileDown size={14} /> Export Report PDF
          </button>
          <button
            onClick={handleOpenAddFuel}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/10 cursor-pointer text-sm"
          >
            <Plus size={16} className="stroke-[2.5]" /> Refuel Vehicle
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 shadow-sm text-left">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Fuel Spend</span>
          <p className="text-2xl font-black mt-2 text-rose-600 dark:text-rose-400">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 shadow-sm text-left">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Refill Logs</span>
          <p className="text-2xl font-black mt-2 text-slate-900 dark:text-white">
            {totalLogs} Entries
          </p>
        </div>
      </div>

      {/* Fuel logs history */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left mb-4">Refueling History Logs</h2>
        
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-semibold text-sm">Loading refueling data...</div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-semibold text-sm">No refueling logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 text-xs">
                  <th className="py-3">Date</th>
                  <th className="py-3">Vehicle</th>
                  <th className="py-3 text-right">Amount Spent</th>
                  <th className="py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {entries.map(entry => (
                  <tr key={entry.id} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition">
                    <td className="py-3.5 font-semibold text-slate-950 dark:text-white">{entry.date}</td>
                    <td className="py-3.5"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-xs">{entry.vehicle}</span></td>
                    <td className="py-3.5 text-right font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(entry.total_cost || 0)}</td>
                    <td className="py-3.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button 
                          onClick={() => handleOpenEditFuel(entry)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
                        >
                          <Edit size={13} />
                        </button>
                        <button 
                          onClick={() => handleDeleteFuel(entry.id)}
                          className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- ADD/EDIT FUEL ENTRY MODAL --- */}
      <Dialog isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)}>
        <form onSubmit={handleSaveFuel}>
          <DialogHeader>
            <DialogTitle>{fuelForm.id ? 'Edit Fuel Refill Log' : 'Record Vehicle Refueling'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={fuelForm.date}
                  onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Vehicle</label>
                <select
                  value={fuelForm.vehicle}
                  onChange={e => setFuelForm({ ...fuelForm, vehicle: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100"
                >
                  <option value="JCB" className="dark:bg-slate-900">JCB</option>
                  <option value="Tractor" className="dark:bg-slate-900">Tractor</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Enter Amount (Rs.)</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={fuelForm.amount}
                onChange={e => setFuelForm({ ...fuelForm, amount: formatIndianNumberString(e.target.value) })}
                placeholder="e.g. 10,000"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsFuelModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-600 transition cursor-pointer"
            >
              Save Refuel Record
            </button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* --- FUEL REPORT PDF RANGE MODAL --- */}
      <Dialog isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)}>
        <div>
          <DialogHeader>
            <DialogTitle>Generate Fuel Purchase Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Report Range Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'today', label: 'Today' },
                  { value: 'month', label: 'Monthly' },
                  { value: 'custom', label: 'Custom' },
                  { value: 'all', label: 'All Time' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPdfForm({ ...pdfForm, range_type: opt.value })}
                    className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      pdfForm.range_type === opt.value
                        ? 'bg-amber-500 border-amber-500 text-slate-950'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {pdfForm.range_type === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={pdfForm.start_date}
                    onChange={e => setPdfForm({ ...pdfForm, start_date: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    required
                    value={pdfForm.end_date}
                    onChange={e => setPdfForm({ ...pdfForm, end_date: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleViewPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Eye size={13} /> View PDF
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FileDown size={13} /> Download
              </button>
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                <Share2 size={13} /> WhatsApp
              </button>
            </div>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
};

export default Fuel;
