import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Calendar,
  Clock,
  Briefcase,
  Users,
  Fuel,
  ArrowUpRight,
  RefreshCw,
  UserCheck,
  FileText,
  Calculator,
  Truck
} from 'lucide-react';
import { reportsService } from '../services/reports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await reportsService.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="animate-spin text-amber-500" size={32} />
        <p className="text-slate-500 font-semibold text-sm">Loading financial dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400">
        <p className="font-bold">{error || 'An error occurred.'}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const today = data.today || { income: 0, expenses: 0, profit: 0 };
  const month = data.month || { income: 0, expenses: 0, profit: 0 };
  const recentActivities = data.recent_activities || [];

  // Chart data
  const chartData = [
    {
      name: 'Today',
      Revenue: today.income,
      Expenses: today.expenses,
      Profit: today.profit,
    },
    {
      name: 'This Month',
      Revenue: month.income,
      Expenses: month.expenses,
      Profit: month.profit,
    }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val).replace('INR', 'Rs.');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase className="text-emerald-500" size={18} />;
      case 'driver_payment': return <Users className="text-blue-500" size={18} />;
      case 'fuel': return <Fuel className="text-amber-500" size={18} />;
      default: return <Clock className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title & Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest block mb-1.5">Welcome Ashok</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Owner Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">Real-time financials for your JCB & Tractor fleet</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
          title="Refresh metrics"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* QUICK NAVIGATION GRID FOR MOBILE/EASY ACCESS */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-left">Quick Portal Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          
          <Link 
            to="/drivers"
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition duration-200 mb-2.5">
              <Users size={22} className="stroke-[2]" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide">Drivers</span>
          </Link>

          <Link 
            to="/customers"
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition duration-200 mb-2.5">
              <UserCheck size={22} className="stroke-[2]" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide">Customers & Jobs</span>
          </Link>

          <Link 
            to="/fuel"
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
          >
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition duration-200 mb-2.5">
              <Fuel size={22} className="stroke-[2]" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide">Fuel Logs</span>
          </Link>

          <Link 
            to="/reports"
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
          >
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition duration-200 mb-2.5">
              <FileText size={22} className="stroke-[2]" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide">Financial Reports</span>
          </Link>

          <Link 
            to="/calculator"
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
          >
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-600 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition duration-200 mb-2.5">
              <Calculator size={22} className="stroke-[2]" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide">Calculator</span>
          </Link>

          <Link 
            to="/job-calculator"
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 group"
          >
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition duration-200 mb-2.5">
              <Truck size={22} className="stroke-[2]" />
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-wide">Job Calculator</span>
          </Link>

        </div>
      </div>

      {/* TODAY METRICS CARD GROUP */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left">Today's Summary</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Income */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-bold leading-tight">Income</span>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-1.5 md:p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <p className="text-base md:text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(today.income)}</p>
            <span className="text-[9px] md:text-xs text-emerald-500 font-bold flex items-center gap-1 mt-1">
              <ArrowUpRight size={11} />Today billings
            </span>
          </div>

          {/* Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-bold leading-tight">Expenses</span>
              <div className="bg-rose-50 dark:bg-rose-950/30 p-1.5 md:p-2 rounded-lg text-rose-600 dark:text-rose-400">
                <TrendingDown size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <p className="text-base md:text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(today.expenses)}</p>
            <span className="text-[9px] md:text-xs text-rose-500 font-bold mt-1 block">
              Fuel &amp; costs
            </span>
          </div>

          {/* Profit */}
          <div className={`border rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200 ${
            today.profit >= 0 
              ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40' 
              : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-sm font-bold leading-tight">Profit</span>
              <div className={`p-1.5 md:p-2 rounded-lg ${
                today.profit >= 0 
                  ? 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-100/60 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
              }`}>
                <IndianRupee size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <p className={`text-base md:text-2xl font-black ${
              today.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>{formatCurrency(today.profit)}</p>
            <span className="text-[9px] md:text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 block">
              Net today
            </span>
          </div>
        </div>
      </div>

      {/* MONTHLY METRICS CARD GROUP */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">This Month's Summary ({new Date().toLocaleString('default', { month: 'long' })})</h2>
        <div className="grid grid-cols-3 gap-3">
          {/* Income */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-bold leading-tight">Income</span>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-1.5 md:p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Calendar size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <p className="text-base md:text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(month.income)}</p>
            <span className="text-[9px] md:text-xs text-emerald-500 font-bold mt-1 block">Cumulative billings</span>
          </div>

          {/* Expenses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-bold leading-tight">Expenses</span>
              <div className="bg-rose-50 dark:bg-rose-950/30 p-1.5 md:p-2 rounded-lg text-rose-600 dark:text-rose-400">
                <TrendingDown size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <p className="text-base md:text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(month.expenses)}</p>
            <span className="text-[9px] md:text-xs text-rose-500 font-bold mt-1 block">Operating costs</span>
          </div>

          {/* Profit */}
          <div className={`border rounded-xl p-3 md:p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition duration-200 ${
            month.profit >= 0 
              ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40' 
              : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-sm font-bold leading-tight">Profit</span>
              <div className={`p-1.5 md:p-2 rounded-lg ${
                month.profit >= 0 
                  ? 'bg-emerald-100/60 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-rose-100/60 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
              }`}>
                <IndianRupee size={14} className="md:w-[18px] md:h-[18px]" />
              </div>
            </div>
            <p className={`text-base md:text-2xl font-black ${
              month.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>{formatCurrency(month.profit)}</p>
            <span className="text-[9px] md:text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 block">
              Net this month
            </span>
          </div>
        </div>
      </div>

      {/* GRAPH AND RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphical Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Revenue vs. Expenses Overview</h2>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  contentStyle={{ 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activities</h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[290px] scrollbar-none">
            {recentActivities.map((act: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between gap-3 text-left">
                <div className="flex gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                    {getActivityIcon(act.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-tight text-slate-800 dark:text-slate-200">{act.title}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      {act.date} {act.vehicle && `• ${act.vehicle}`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-extrabold leading-none ${
                  act.type === 'job' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {act.type === 'job' ? '+' : '-'}{formatCurrency(act.amount)}
                </span>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-center text-slate-400 py-12 text-sm font-semibold">
                No recent transactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
