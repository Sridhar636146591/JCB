import React, { useState } from 'react';
import { Timer, Truck, RefreshCw } from 'lucide-react';

const JobCalculator: React.FC = () => {
  const [jobMode, setJobMode] = useState<'hourly' | 'loading'>('hourly');
  const [hours, setHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [loads, setLoads] = useState('');
  const [ratePerLoad, setRatePerLoad] = useState('');

  const parseIN = (v: string) => parseFloat(v.replace(/,/g, '')) || 0;

  const fmtIN = (v: number) =>
    v === 0
      ? '—'
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        })
          .format(v)
          .replace('INR', 'Rs.');

  const jobAmount =
    jobMode === 'hourly'
      ? parseIN(hours) * parseIN(ratePerHour)
      : parseIN(loads) * parseIN(ratePerLoad);

  const handleReset = () => {
    setHours('');
    setRatePerHour('');
    setLoads('');
    setRatePerLoad('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Job Amount Calculator</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
          Instantly calculate job billing — choose Hourly or Loading / Trips mode.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ── Calculator Card ── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-3xl shadow-sm overflow-hidden">

          {/* Mode Toggle */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => { setJobMode('hourly'); handleReset(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-bold transition cursor-pointer ${
                jobMode === 'hourly'
                  ? 'bg-amber-500 text-slate-900'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Timer size={17} /> Hourly Work
            </button>
            <button
              onClick={() => { setJobMode('loading'); handleReset(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-5 text-sm font-bold transition cursor-pointer ${
                jobMode === 'loading'
                  ? 'bg-amber-500 text-slate-900'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Truck size={17} /> Loading / Trips
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Inputs */}
            {jobMode === 'hourly' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Number of Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    placeholder="e.g. 8"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-2xl font-black focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[11px] text-slate-400 font-semibold">Total hours worked on the job</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Rate per Hour (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ratePerHour}
                    onChange={e => setRatePerHour(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-2xl font-black focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[11px] text-slate-400 font-semibold">Charge per hour of operation</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Number of Loads / Trips
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={loads}
                    onChange={e => setLoads(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-2xl font-black focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[11px] text-slate-400 font-semibold">Total number of loads or trips made</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Rate per Load (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={ratePerLoad}
                    onChange={e => setRatePerLoad(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-2xl font-black focus:outline-none focus:border-amber-500 transition"
                  />
                  <p className="text-[11px] text-slate-400 font-semibold">Charge per individual load or trip</p>
                </div>
              </div>
            )}

            {/* Formula Display */}
            {jobAmount > 0 && (
              <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl py-3 px-4">
                {jobMode === 'hourly' ? (
                  <>
                    <span className="text-slate-700 dark:text-slate-200">{hours} hrs</span>
                    <span className="text-amber-500 text-lg">×</span>
                    <span className="text-slate-700 dark:text-slate-200">Rs. {ratePerHour}/hr</span>
                    <span className="text-amber-500 text-lg">=</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-700 dark:text-slate-200">{loads} loads</span>
                    <span className="text-amber-500 text-lg">×</span>
                    <span className="text-slate-700 dark:text-slate-200">Rs. {ratePerLoad}/load</span>
                    <span className="text-amber-500 text-lg">=</span>
                  </>
                )}
                <span className="text-emerald-600 dark:text-emerald-400 text-base">{fmtIN(jobAmount)}</span>
              </div>
            )}

            {/* Reset */}
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-500 font-bold uppercase tracking-wider cursor-pointer transition"
              >
                <RefreshCw size={12} /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Result Panel ── */}
        <div className={`rounded-3xl shadow-sm border p-6 flex flex-col justify-between min-h-[280px] transition-all duration-300 ${
          jobAmount > 0
            ? 'bg-slate-900 border-slate-700'
            : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80'
        }`}>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${jobAmount > 0 ? 'text-slate-400' : 'text-slate-400'}`}>
              Total Billing Amount
            </span>
            <p className={`text-5xl font-black mt-4 leading-none tracking-tight transition-all ${
              jobAmount > 0 ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'
            }`}>
              {fmtIN(jobAmount)}
            </p>
            {jobAmount === 0 && (
              <p className="text-xs text-slate-300 dark:text-slate-600 font-semibold mt-3">
                Enter values to see the billing amount here.
              </p>
            )}
          </div>

          {jobAmount > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-700 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>{jobMode === 'hourly' ? 'Hours' : 'Loads'}</span>
                <span className="text-slate-200">{jobMode === 'hourly' ? hours : loads}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Rate</span>
                <span className="text-slate-200">Rs. {jobMode === 'hourly' ? ratePerHour : ratePerLoad}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-amber-400 pt-1 border-t border-slate-700">
                <span>Total</span>
                <span>{fmtIN(jobAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCalculator;
