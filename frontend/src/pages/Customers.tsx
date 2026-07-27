import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileDown, 
  MapPin, 
  Phone, 
  Calendar,
  Layers,
  Search,
  ChevronRight,
  Eye,
  Share2
} from 'lucide-react';
import type { Customer, CustomerJob } from '../services/customers';
import { customersService } from '../services/customers';
import { driversService } from '../services/drivers';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/UI/Dialog';
import { formatIndianNumberString, parseIndianNumberString } from '../utils/format';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [jobs, setJobs] = useState<CustomerJob[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  
  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  
  // Form states
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [customerForm, setCustomerForm] = useState({ id: null as number | null, name: '', phone: '', village: '' });
  const [jobForm, setJobForm] = useState({
    id: null as number | null,
    date: '',
    vehicle: 'JCB',
    driver_id: '' as string | number,
    work_type: 'hourly' as 'hourly' | 'loading',
    hours: '',
    rate_per_hour: '',
    loads: '',
    rate_per_load: '',
    food: '0',
    bata: '0',
    diesel: '0',
    additional_charges: '0',
    other_expenses: '0',
    amount_paid: '0',
    notes: ''
  });

  const fetchCustomers = async (searchVal = '') => {
    try {
      setLoading(true);
      const data = await customersService.getCustomers(searchVal);
      setCustomers(data);
      if (data.length > 0 && !selectedCustomer) {
        selectCustomer(data[0], false);
      }
    } catch (err) {
      console.error('Error fetching customers', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = async (cust: Customer, shouldSwitchMode = true) => {
    setSelectedCustomer(cust);
    if (shouldSwitchMode) {
      setViewMode('detail');
    }
    try {
      setJobsLoading(true);
      const data = await customersService.getCustomerJobs(cust.id);
      setJobs(data);
    } catch (err) {
      console.error('Error fetching customer jobs', err);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const data = await driversService.getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error('Error fetching drivers', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchDrivers();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchCustomers(e.target.value);
  };

  // --- CUSTOMER ACTIONS ---
  const handleOpenAddCustomer = () => {
    setCustomerForm({ id: null, name: '', phone: '', village: '' });
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerForm({ id: cust.id, name: cust.name, phone: cust.phone, village: cust.village });
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) return;
    
    try {
      if (customerForm.id) {
        const updated = await customersService.editCustomer(customerForm.id, customerForm);
        setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated);
      } else {
        const added = await customersService.addCustomer(customerForm);
        setCustomers(prev => [...prev, added]);
        if (!selectedCustomer) selectCustomer(added);
      }
      setIsCustomerModalOpen(false);
    } catch (err) {
      console.error('Error saving customer', err);
    }
  };

  const handleDeleteCustomer = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this customer profile? All job bills and details will be deleted.')) return;
    
    try {
      await customersService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null);
        setJobs([]);
      }
    } catch (err) {
      console.error('Error deleting customer', err);
    }
  };

  // --- JOB ACTIONS ---
  const handleOpenAddJob = () => {
    setJobForm({
      id: null,
      date: new Date().toISOString().split('T')[0],
      vehicle: 'JCB',
      driver_id: '',
      work_type: 'hourly',
      hours: '',
      rate_per_hour: '',
      loads: '',
      rate_per_load: '',
      food: '0',
      bata: '0',
      diesel: '0',
      additional_charges: '0',
      other_expenses: '0',
      amount_paid: '0',
      notes: ''
    });
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: CustomerJob) => {
    setJobForm({
      id: job.id,
      date: job.date,
      vehicle: job.vehicle,
      driver_id: job.driver_id || '',
      work_type: job.work_type,
      hours: job.hours?.toString() || '',
      rate_per_hour: formatIndianNumberString(job.rate_per_hour?.toString() || ''),
      loads: job.loads?.toString() || '',
      rate_per_load: formatIndianNumberString(job.rate_per_load?.toString() || ''),
      food: formatIndianNumberString(job.food.toString()),
      bata: formatIndianNumberString(job.bata.toString()),
      diesel: formatIndianNumberString(job.diesel.toString()),
      additional_charges: formatIndianNumberString(job.additional_charges.toString()),
      other_expenses: formatIndianNumberString(job.other_expenses.toString()),
      amount_paid: formatIndianNumberString(job.amount_paid.toString()),
      notes: job.notes || ''
    });
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    const jobPayload = {
      ...jobForm,
      hours: parseFloat(jobForm.hours) || 0,
      rate_per_hour: parseIndianNumberString(jobForm.rate_per_hour) || 0,
      loads: parseInt(jobForm.loads) || 0,
      rate_per_load: parseIndianNumberString(jobForm.rate_per_load) || 0,
      food: parseIndianNumberString(jobForm.food) || 0,
      bata: parseIndianNumberString(jobForm.bata) || 0,
      diesel: parseIndianNumberString(jobForm.diesel) || 0,
      additional_charges: parseIndianNumberString(jobForm.additional_charges) || 0,
      other_expenses: parseIndianNumberString(jobForm.other_expenses) || 0,
      amount_paid: parseIndianNumberString(jobForm.amount_paid) || 0,
    };
    
    try {
      if (jobForm.id) {
        await customersService.editCustomerJob(jobForm.id, jobPayload);
      } else {
        await customersService.addCustomerJob(selectedCustomer.id, jobPayload);
      }
      selectCustomer(selectedCustomer);
      setIsJobModalOpen(false);
    } catch (err) {
      console.error('Error saving job entry', err);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job bill? This cannot be undone.')) return;
    try {
      await customersService.deleteCustomerJob(jobId);
      if (selectedCustomer) selectCustomer(selectedCustomer);
    } catch (err) {
      console.error('Error deleting job', err);
    }
  };

  const handleDownloadInvoice = async (job: CustomerJob) => {
    if (!job.id) return;
    try {
      await customersService.downloadInvoice(job.id, job.customer_name || 'Customer', job.date);
    } catch (err) {
      console.error('Error downloading invoice', err);
    }
  };

  const handleViewInvoice = async (job: CustomerJob) => {
    if (!job.id) return;
    try {
      await customersService.viewInvoice(job.id);
    } catch (err) {
      console.error('Error viewing invoice', err);
    }
  };

  const handleShareWhatsApp = (job: CustomerJob) => {
    if (!job) return;
    const customerName = job.customer_name || 'Customer';
    const date = job.date;
    const vehicle = job.vehicle;
    const workType = job.work_type === 'hourly' ? 'Hourly' : 'Loading/Trip';
    const qty = job.work_type === 'hourly' ? `${job.hours} Hrs` : `${job.loads} Loads`;
    const total = job.total_amount || 0;
    const diesel = job.diesel || 0;
    const amountExclDiesel = total - diesel;
    const paid = job.amount_paid || 0;
    const balance = job.balance || 0;
    
    let text = `*JCB & Tractor Rental Services Bill*\n\n`;
    text += `*Customer:* ${customerName}\n`;
    text += `*Date:* ${date}\n`;
    text += `*Vehicle:* ${vehicle}\n`;
    text += `*Work Type:* ${workType} (${qty})\n`;
    text += `---------------------------\n`;
    text += `*Total Amount:* Rs. ${total.toLocaleString('en-IN')}\n`;
    if (diesel > 0) {
      text += `*Amount (excl. Diesel):* Rs. ${amountExclDiesel.toLocaleString('en-IN')}\n`;
    }
    text += `*Amount Paid:* Rs. ${paid.toLocaleString('en-IN')}\n`;
    text += `*Balance Owed:* Rs. ${balance.toLocaleString('en-IN')}\n\n`;
    text += `Thank you for your business!`;
    
    const encodedText = encodeURIComponent(text);
    
    // Sanitize phone number (remove spaces, symbols)
    let phone = job.customer_phone || '';
    phone = phone.replace(/\D/g, ''); // keep only numbers
    
    // Default country prefix if it's 10 digits (India +91)
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // Live modal math
  const getModalAmount = () => {
    if (jobForm.work_type === 'hourly') {
      return (parseFloat(jobForm.hours) || 0) * (parseIndianNumberString(jobForm.rate_per_hour) || 0);
    } else {
      return (parseInt(jobForm.loads) || 0) * (parseIndianNumberString(jobForm.rate_per_load) || 0);
    }
  };

  const getModalExpenses = () => {
    return (parseIndianNumberString(jobForm.food) || 0) +
           (parseIndianNumberString(jobForm.bata) || 0) +
           (parseIndianNumberString(jobForm.diesel) || 0) +
           (parseIndianNumberString(jobForm.additional_charges) || 0) +
           (parseIndianNumberString(jobForm.other_expenses) || 0);
  };

  const getModalProfit = () => {
    return getModalAmount() - getModalExpenses();
  };

  const getModalBalance = () => {
    return getModalAmount() - (parseIndianNumberString(jobForm.amount_paid) || 0);
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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Customer Jobs Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">Manage customer registry and detailed job billing sheets</p>
        </div>
        <button
          onClick={handleOpenAddCustomer}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/10 cursor-pointer text-sm"
        >
          <Plus size={16} className="stroke-[2.5]" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CUSTOMERS SIDEBAR */}
        <div className={`${viewMode === 'list' ? 'block' : 'hidden'} lg:block bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4`}>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name, phone, village..."
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500 transition duration-200"
            />
          </div>

          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-left">Customer List</h2>
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">No customers found.</div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {customers.map(c => (
                <div
                  key={c.id}
                  onClick={() => selectCustomer(c)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    selectedCustomer?.id === c.id
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                      : 'bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{c.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold mt-1 uppercase">
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> {c.village}</span>
                      <span className="flex items-center gap-0.5"><Phone size={10} /> {c.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <button
                      onClick={(e) => handleOpenEditCustomer(c, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCustomer(c.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILED VIEW - CUSTOMER JOBS */}
        <div className={`${viewMode === 'detail' ? 'block' : 'hidden'} lg:block lg:col-span-2 space-y-6`}>
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Back button on mobile */}
              <button
                onClick={() => setViewMode('list')}
                className="lg:hidden flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer pb-1"
              >
                ← Back to Customer List
              </button>

              {/* Info Banner */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Account profile</span>
                  <h2 className="text-xl font-extrabold mt-1">{selectedCustomer.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12} /> village: {selectedCustomer.village}</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> Contact: {selectedCustomer.phone}</span>
                  </div>
                </div>
                <button
                  onClick={handleOpenAddJob}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer self-start md:self-auto"
                >
                  <Plus size={14} className="stroke-[2.5]" /> Record Job Sheet
                </button>
              </div>

              {/* Jobs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left">Job Entries & Billings</h2>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      value={jobSearch}
                      onChange={e => setJobSearch(e.target.value)}
                      placeholder="Search by S.No or date..."
                      className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-1.5 text-xs font-semibold focus:outline-none focus:border-amber-500 transition duration-200 w-52"
                    />
                  </div>
                </div>
                
                {jobsLoading ? (
                  <div className="py-12 text-center text-slate-400 font-semibold text-xs animate-pulse">Loading jobs logs...</div>
                ) : jobs.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl py-12 px-6 text-center text-slate-400 font-semibold text-sm">
                    No jobs recorded for this customer.
                  </div>
                ) : (() => {
                  const filteredJobs = jobSearch.trim()
                    ? jobs.filter(job =>
                        String(job.id).includes(jobSearch.trim()) ||
                        (job.date && job.date.includes(jobSearch.trim()))
                      )
                    : jobs;
                  return filteredJobs.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl py-8 px-6 text-center text-slate-400 font-semibold text-sm">
                      No jobs match your search.
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {filteredJobs.map(job => (
                      <div 
                        key={job.id} 
                        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm text-left flex flex-col md:flex-row justify-between gap-4 hover:shadow-md transition duration-200"
                      >
                        <div className="space-y-3 flex-1 min-w-0">
                          {/* Top Row: Date & Vehicle */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-wider">
                              {job.vehicle}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <Calendar size={12} /> {job.date}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              Driver: <span className="text-slate-600 dark:text-slate-300">{job.driver_name}</span>
                            </span>
                          </div>

                          {/* Middle Row: Calculations */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Work details</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {job.work_type === 'hourly' 
                                  ? `${job.hours} Hrs @ ${formatCurrency(job.rate_per_hour || 0)}` 
                                  : `${job.loads} Loads @ ${formatCurrency(job.rate_per_load || 0)}`
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Billed</p>
                              <p className="text-xs font-extrabold text-slate-950 dark:text-white mt-0.5">
                                {formatCurrency(job.total_amount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expenses (Bata/Fuel...)</p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                                {formatCurrency(job.total_expenses || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Profit</p>
                              <p className={`text-xs font-extrabold mt-0.5 ${
                                (job.net_profit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {formatCurrency(job.net_profit || 0)}
                              </p>
                            </div>
                          </div>

                          {/* Extra info/notes */}
                          {job.notes && (
                            <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/40 max-w-xl truncate">
                              Notes: {job.notes}
                            </p>
                          )}
                          
                          {/* Payment Balance */}
                          <div className="flex items-center gap-4 text-xs font-bold pt-1.5 border-t border-slate-100 dark:border-slate-800/40">
                            <span className="text-slate-500">Paid: {formatCurrency(job.amount_paid)}</span>
                            <span className={job.balance && job.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                              Balance: {formatCurrency(job.balance || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Actions right panel */}
                        <div className="flex md:flex-col justify-end gap-2 shrink-0 md:border-l md:border-slate-100 dark:md:border-slate-800/60 md:pl-4">
                          <button
                            onClick={() => handleViewInvoice(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Eye size={12} /> View Bill
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <FileDown size={12} /> Download PDF
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(job)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-750 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            <Share2 size={12} /> Share WhatsApp
                          </button>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditJob(job)}
                              className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id!)}
                              className="p-2 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[50vh]">
              <Layers size={48} className="text-slate-300 dark:text-slate-700 stroke-[1.5] mb-4" />
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Customer Selected</h2>
              <p className="text-sm text-slate-400 font-semibold max-w-sm mt-1">Select a customer from the sidebar or click Add Customer to register a client and record billings.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD/EDIT CUSTOMER MODAL --- */}
      <Dialog isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)}>
        <form onSubmit={handleSaveCustomer}>
          <DialogHeader>
            <DialogTitle>{customerForm.id ? 'Edit Customer Info' : 'Register New Customer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Customer Name</label>
              <input
                type="text"
                required
                value={customerForm.name}
                onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                placeholder="Enter customer name"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Phone Number <span className="normal-case text-slate-300 dark:text-slate-600 font-medium">(Optional)</span></label>
              <input
                type="text"
                value={customerForm.phone}
                onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                placeholder="Enter contact number (optional)"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Village / Location <span className="normal-case text-slate-300 dark:text-slate-600 font-medium">(Optional)</span></label>
              <input
                type="text"
                value={customerForm.village}
                onChange={e => setCustomerForm({ ...customerForm, village: e.target.value })}
                placeholder="Enter location / village (optional)"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-600 transition cursor-pointer"
            >
              Save Details
            </button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* --- ADD/EDIT JOB SHEET MODAL --- */}
      <Dialog isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)}>
        <form onSubmit={handleSaveJob} className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{jobForm.id ? 'Modify Job Entry' : 'Record New Job Billing'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={jobForm.date}
                  onChange={e => setJobForm({ ...jobForm, date: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Vehicle</label>
                <select
                  value={jobForm.vehicle}
                  onChange={e => setJobForm({ ...jobForm, vehicle: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100"
                >
                  <option value="JCB" className="dark:bg-slate-900">JCB</option>
                  <option value="Tractor" className="dark:bg-slate-900">Tractor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Driver / Operator</label>
                <select
                  value={jobForm.driver_id}
                  onChange={e => setJobForm({ ...jobForm, driver_id: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100"
                >
                  <option value="" className="dark:bg-slate-900">Owner Driven / None</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id} className="dark:bg-slate-900">{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Work Billing Type</label>
                <select
                  value={jobForm.work_type}
                  onChange={e => setJobForm({ ...jobForm, work_type: e.target.value as any })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100"
                >
                  <option value="hourly" className="dark:bg-slate-900">Hourly billing</option>
                  <option value="loading" className="dark:bg-slate-900">Loading / Trip billing</option>
                </select>
              </div>
            </div>

            {/* Hourly details */}
            {jobForm.work_type === 'hourly' && (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Total Hours</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={jobForm.hours}
                    onChange={e => setJobForm({ ...jobForm, hours: e.target.value })}
                    placeholder="e.g. 5.5"
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Rate per Hour (Rs.)</label>
                  <input
                    type="text"
                    required
                    value={jobForm.rate_per_hour}
                    onChange={e => setJobForm({ ...jobForm, rate_per_hour: formatIndianNumberString(e.target.value) })}
                    placeholder="e.g. 800"
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Loading details */}
            {jobForm.work_type === 'loading' && (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/40 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Number of Loads</label>
                  <input
                    type="number"
                    required
                    value={jobForm.loads}
                    onChange={e => setJobForm({ ...jobForm, loads: e.target.value })}
                    placeholder="e.g. 10"
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Rate per Load (Rs.)</label>
                  <input
                    type="text"
                    required
                    value={jobForm.rate_per_load}
                    onChange={e => setJobForm({ ...jobForm, rate_per_load: formatIndianNumberString(e.target.value) })}
                    placeholder="e.g. 200"
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Expenses */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Job Operating Expenses</label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Food Cost</label>
                  <input
                    type="text"
                    value={jobForm.food}
                    onChange={e => setJobForm({ ...jobForm, food: formatIndianNumberString(e.target.value) })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Driver Bata</label>
                  <input
                    type="text"
                    value={jobForm.bata}
                    onChange={e => setJobForm({ ...jobForm, bata: formatIndianNumberString(e.target.value) })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Job Diesel</label>
                  <input
                    type="text"
                    value={jobForm.diesel}
                    onChange={e => setJobForm({ ...jobForm, diesel: formatIndianNumberString(e.target.value) })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Additional Charges</label>
                  <input
                    type="text"
                    value={jobForm.additional_charges}
                    onChange={e => setJobForm({ ...jobForm, additional_charges: formatIndianNumberString(e.target.value) })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Other Expenses</label>
                  <input
                    type="text"
                    value={jobForm.other_expenses}
                    onChange={e => setJobForm({ ...jobForm, other_expenses: formatIndianNumberString(e.target.value) })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Payments received */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Amount Paid by Customer (Rs.)</label>
                <input
                  type="text"
                  value={jobForm.amount_paid}
                  onChange={e => setJobForm({ ...jobForm, amount_paid: formatIndianNumberString(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Notes / Remarks</label>
                <input
                  type="text"
                  value={jobForm.notes}
                  onChange={e => setJobForm({ ...jobForm, notes: e.target.value })}
                  placeholder="e.g. soil loading, canal excavation"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Real-time Math Summary Preview */}
            <div className="bg-slate-900 text-slate-200 dark:bg-slate-950 p-4 rounded-xl space-y-2 mt-4 text-xs font-semibold">
              <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Calculation Summary Preview</h4>
              <div className="grid grid-cols-2 gap-y-1 gap-x-6">
                <div className="flex justify-between"><span>Gross Amount:</span> <span className="font-bold text-white">{formatCurrency(getModalAmount())}</span></div>
                <div className="flex justify-between"><span>Total Expenses:</span> <span className="font-bold text-slate-300">{formatCurrency(getModalExpenses())}</span></div>
                <div className="flex justify-between"><span>Net Profit:</span> <span className={`font-bold ${(getModalProfit()) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(getModalProfit())}</span></div>
                <div className="flex justify-between"><span>Outstanding Balance:</span> <span className={`font-bold ${getModalBalance() > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{formatCurrency(getModalBalance())}</span></div>
              </div>
            </div>

          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsJobModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-600 transition cursor-pointer"
            >
              Save Job Bill
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};

export default Customers;
