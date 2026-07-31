import React, { useState, useEffect, useRef } from 'react';
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
  Share2,
  AlertCircle
} from 'lucide-react';
import type { Customer, CustomerJob } from '../services/customers';
import { customersService } from '../services/customers';
import { driversService } from '../services/drivers';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/UI/Dialog';
import { formatIndianNumberString, parseIndianNumberString } from '../utils/format';

const Customers: React.FC = () => {
  const additionalDaysContainerRef = useRef<HTMLDivElement>(null);
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
  const [customerError, setCustomerError] = useState('');
  const [jobError, setJobError] = useState('');
  const [savingJob, setSavingJob] = useState(false);
  
  // Form states
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [customerForm, setCustomerForm] = useState({ id: null as number | null, name: '', phone: '', village: '' });
  const [jobForm, setJobForm] = useState({
    id: null as number | null,
    day_number: '1',
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
    notes: '',
    days: [] as {
      day_number: string;
      date: string;
      vehicle: string;
      driver_id: string | number;
      work_type: 'hourly' | 'loading';
      hours: string;
      rate_per_hour: string;
      loads: string;
      rate_per_load: string;
      food: string;
      bata: string;
      diesel: string;
      additional_charges: string;
      other_expenses: string;
    }[]
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
    setCustomerError('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditCustomer = (cust: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerForm({ id: cust.id, name: cust.name, phone: cust.phone, village: cust.village });
    setCustomerError('');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) return;
    
    setCustomerError('');
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
    } catch (err: any) {
      console.error('Error saving customer', err);
      setCustomerError(err.response?.data?.message || err.message || 'Failed to save customer details.');
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
    const today = new Date().toISOString().split('T')[0];
    setJobForm({
      id: null,
      day_number: '1',
      date: today,
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
      notes: '',
      days: [] // no additional days initially
    });
    setJobError('');
    setIsJobModalOpen(true);
  };

  const handleOpenEditJob = (job: CustomerJob) => {
    let day1 = {
      day_number: '1',
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
      other_expenses: formatIndianNumberString(job.other_expenses.toString())
    };
    
    let additionalDays: typeof jobForm.days = [];
    if (job.days && job.days.length > 0) {
      // First day is mapped to top level fields
      const d1 = job.days[0];
      day1 = {
        day_number: (d1.day_number !== undefined ? d1.day_number : 1).toString(),
        date: d1.date,
        vehicle: d1.vehicle,
        driver_id: d1.driver_id || '',
        work_type: d1.work_type,
        hours: d1.hours?.toString() || '',
        rate_per_hour: formatIndianNumberString(d1.rate_per_hour?.toString() || ''),
        loads: d1.loads?.toString() || '',
        rate_per_load: formatIndianNumberString(d1.rate_per_load?.toString() || ''),
        food: formatIndianNumberString((d1.food !== undefined ? d1.food : job.food).toString()),
        bata: formatIndianNumberString((d1.bata !== undefined ? d1.bata : job.bata).toString()),
        diesel: formatIndianNumberString((d1.diesel !== undefined ? d1.diesel : job.diesel).toString()),
        additional_charges: formatIndianNumberString((d1.additional_charges !== undefined ? d1.additional_charges : job.additional_charges).toString()),
        other_expenses: formatIndianNumberString((d1.other_expenses !== undefined ? d1.other_expenses : job.other_expenses).toString())
      };
      
      // Remainder are mapped to jobForm.days
      additionalDays = job.days.slice(1).map((d, index) => ({
        day_number: (d.day_number !== undefined ? d.day_number : (index + 2)).toString(),
        date: d.date,
        vehicle: d.vehicle,
        driver_id: d.driver_id || '',
        work_type: d.work_type,
        hours: d.hours?.toString() || '',
        rate_per_hour: formatIndianNumberString(d.rate_per_hour?.toString() || ''),
        loads: d.loads?.toString() || '',
        rate_per_load: formatIndianNumberString(d.rate_per_load?.toString() || ''),
        food: formatIndianNumberString((d.food !== undefined ? d.food : 0).toString()),
        bata: formatIndianNumberString((d.bata !== undefined ? d.bata : 0).toString()),
        diesel: formatIndianNumberString((d.diesel !== undefined ? d.diesel : 0).toString()),
        additional_charges: formatIndianNumberString((d.additional_charges !== undefined ? d.additional_charges : 0).toString()),
        other_expenses: formatIndianNumberString((d.other_expenses !== undefined ? d.other_expenses : 0).toString())
      }));
    }

    setJobForm({
      id: job.id,
      day_number: day1.day_number,
      date: day1.date,
      vehicle: day1.vehicle,
      driver_id: day1.driver_id,
      work_type: day1.work_type,
      hours: day1.hours,
      rate_per_hour: day1.rate_per_hour,
      loads: day1.loads,
      rate_per_load: day1.rate_per_load,
      food: day1.food,
      bata: day1.bata,
      diesel: day1.diesel,
      additional_charges: day1.additional_charges,
      other_expenses: day1.other_expenses,
      amount_paid: formatIndianNumberString(job.amount_paid.toString()),
      notes: job.notes || '',
      days: additionalDays
    });
    setJobError('');
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || savingJob) return;
    
    setSavingJob(true);
    const day1 = {
      day_number: parseInt(jobForm.day_number) || 1,
      date: jobForm.date,
      vehicle: jobForm.vehicle,
      driver_id: jobForm.driver_id === '' ? null : jobForm.driver_id,
      work_type: jobForm.work_type,
      hours: parseFloat(jobForm.hours) || 0,
      rate_per_hour: parseIndianNumberString(jobForm.rate_per_hour) || 0,
      loads: parseInt(jobForm.loads) || 0,
      rate_per_load: parseIndianNumberString(jobForm.rate_per_load) || 0,
      food: parseIndianNumberString(jobForm.food) || 0,
      bata: parseIndianNumberString(jobForm.bata) || 0,
      diesel: parseIndianNumberString(jobForm.diesel) || 0,
      additional_charges: parseIndianNumberString(jobForm.additional_charges) || 0,
      other_expenses: parseIndianNumberString(jobForm.other_expenses) || 0
    };
    
    const additionalDays = jobForm.days.map((d, index) => {
      // Automatically calculate consecutive date starting from Day 1's date
      const dt = new Date(jobForm.date);
      if (!isNaN(dt.getTime())) {
        dt.setDate(dt.getDate() + (index + 1));
      }
      const dayDate = !isNaN(dt.getTime()) ? dt.toISOString().split('T')[0] : jobForm.date;
      
      return {
        day_number: parseInt(d.day_number) || (index + 2),
        date: dayDate,
        vehicle: d.vehicle,
        driver_id: d.driver_id === '' ? null : d.driver_id,
        work_type: d.work_type,
        hours: parseFloat(d.hours) || 0,
        rate_per_hour: parseIndianNumberString(d.rate_per_hour) || 0,
        loads: parseInt(d.loads) || 0,
        rate_per_load: parseIndianNumberString(d.rate_per_load) || 0,
        food: parseIndianNumberString(d.food) || 0,
        bata: parseIndianNumberString(d.bata) || 0,
        diesel: parseIndianNumberString(d.diesel) || 0,
        additional_charges: parseIndianNumberString(d.additional_charges) || 0,
        other_expenses: parseIndianNumberString(d.other_expenses) || 0
      };
    });
    
    const jobPayload = {
      ...jobForm,
      hours: day1.hours,
      rate_per_hour: day1.rate_per_hour,
      loads: day1.loads,
      rate_per_load: day1.rate_per_load,
      date: day1.date,
      vehicle: day1.vehicle,
      driver_id: day1.driver_id,
      work_type: day1.work_type,
      food: day1.food,
      bata: day1.bata,
      diesel: day1.diesel,
      additional_charges: day1.additional_charges,
      other_expenses: day1.other_expenses,
      amount_paid: parseIndianNumberString(jobForm.amount_paid) || 0,
      days: [day1, ...additionalDays]
    };
    
    setJobError('');
    try {
      if (jobForm.id) {
        await customersService.editCustomerJob(jobForm.id, jobPayload);
      } else {
        await customersService.addCustomerJob(selectedCustomer.id, jobPayload);
      }
      selectCustomer(selectedCustomer);
      setIsJobModalOpen(false);
    } catch (err: any) {
      console.error('Error saving job entry', err);
      setJobError(err.response?.data?.message || err.message || 'Failed to save job entry details.');
    } finally {
      setSavingJob(false);
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

  const handleShareWhatsApp = async (job: CustomerJob) => {
    if (!job) return;
    const customerName = job.customer_name || 'Customer';
    const date = job.date;
    const vehicle = job.vehicle;
    const workType = job.work_type === 'hourly' ? 'Hourly' : 'Loading/Trip';
    const qty = job.days && job.days.length > 1
      ? `${job.days.length} Days`
      : (job.work_type === 'hourly' ? `${job.hours} Hrs` : `${job.loads} Loads`);
    const total = job.total_amount || 0;
    const diesel = job.diesel || 0;
    const amountExclDiesel = total - diesel;
    const paid = job.amount_paid || 0;
    const balance = job.balance || 0;
    
    // Attempt to share the actual PDF file using the Web Share API (supported on mobile/modern browsers)
    if (navigator.share && navigator.canShare && job.id) {
      try {
        const blob = await customersService.getInvoiceBlob(job.id);
        const file = new File([blob], `Invoice_${customerName.replace(/\s+/g, '_')}_${date}.pdf`, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Invoice for ${customerName}`,
            text: `JCB & Tractor Services Bill for ${customerName}`
          });
          return; // Successfully shared file
        }
      } catch (shareErr) {
        console.error('Failed to share PDF file using Web Share API, falling back to text message', shareErr);
      }
    }
    
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
    // Day 1
    let total = 0;
    if (jobForm.work_type === 'hourly') {
      total += (parseFloat(jobForm.hours) || 0) * (parseIndianNumberString(jobForm.rate_per_hour) || 0);
    } else {
      total += (parseInt(jobForm.loads) || 0) * (parseIndianNumberString(jobForm.rate_per_load) || 0);
    }
    
    // Additional Days
    if (jobForm.days && jobForm.days.length > 0) {
      for (const d of jobForm.days) {
        if (d.work_type === 'hourly') {
          total += (parseFloat(d.hours) || 0) * (parseIndianNumberString(d.rate_per_hour) || 0);
        } else {
          total += (parseInt(d.loads) || 0) * (parseIndianNumberString(d.rate_per_load) || 0);
        }
      }
    }
    return total;
  };

  const getModalExpenses = () => {
    let total = (parseIndianNumberString(jobForm.food) || 0) +
                (parseIndianNumberString(jobForm.bata) || 0) +
                (parseIndianNumberString(jobForm.diesel) || 0) +
                (parseIndianNumberString(jobForm.additional_charges) || 0) +
                (parseIndianNumberString(jobForm.other_expenses) || 0);
                
    if (jobForm.days && jobForm.days.length > 0) {
      for (const d of jobForm.days) {
        total += (parseIndianNumberString(d.food) || 0) +
                 (parseIndianNumberString(d.bata) || 0) +
                 (parseIndianNumberString(d.diesel) || 0) +
                 (parseIndianNumberString(d.additional_charges) || 0) +
                 (parseIndianNumberString(d.other_expenses) || 0);
      }
    }
    return total;
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
                                {job.days && job.days.length > 1 ? (
                                  <span>{job.days.length} Days of Work</span>
                                ) : (
                                  job.work_type === 'hourly' 
                                    ? `${job.hours} Hrs @ ${formatCurrency(job.rate_per_hour || 0)}` 
                                    : `${job.loads} Loads @ ${formatCurrency(job.rate_per_load || 0)}`
                                )}
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
                        <div className="flex flex-wrap md:flex-col justify-end gap-2 shrink-0 md:border-l md:border-slate-100 dark:md:border-slate-800/60 md:pl-4">
                          <button
                            onClick={() => handleViewInvoice(job)}
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer min-h-[36px]"
                          >
                            <Eye size={13} /> View Bill
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(job)}
                            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer min-h-[36px]"
                          >
                            <FileDown size={13} /> Download
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(job)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer min-h-[36px]"
                          >
                            <Share2 size={13} /> WhatsApp
                          </button>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleOpenEditJob(job)}
                              className="p-2.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer min-h-[36px] min-w-[36px]"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id!)}
                              className="p-2.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer min-h-[36px] min-w-[36px]"
                            >
                              <Trash2 size={13} />
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
          {customerError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle size={16} className="shrink-0" />
              <span>{customerError}</span>
            </div>
          )}
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
                type="tel"
                inputMode="tel"
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
        <form onSubmit={handleSaveJob} className="">
          <DialogHeader>
            <DialogTitle>{jobForm.id ? 'Modify Job Entry' : 'Record New Job Billing'}</DialogTitle>
          </DialogHeader>
          {jobError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 text-left">
              <AlertCircle size={16} className="shrink-0" />
              <span>{jobError}</span>
            </div>
          )}
          <div className="space-y-4 py-2 text-left pr-1">
            {/* Section 1: Day 1 Details */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Day {jobForm.day_number} Details</span>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Day</label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    required
                    value={jobForm.day_number}
                    onChange={e => setJobForm({ ...jobForm, day_number: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    required
                    value={jobForm.date}
                    onChange={e => setJobForm({ ...jobForm, date: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Vehicle</label>
                  <select
                    value={jobForm.vehicle}
                    onChange={e => setJobForm({ ...jobForm, vehicle: e.target.value })}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100 font-semibold"
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
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100 font-semibold"
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
                    className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100 font-semibold"
                  >
                    <option value="hourly" className="dark:bg-slate-900">
                      {jobForm.vehicle === 'Tractor' ? 'Daily billing' : 'Hourly billing'}
                    </option>
                    <option value="loading" className="dark:bg-slate-900">Loading / Trip billing</option>
                  </select>
                </div>
              </div>

              {jobForm.work_type === 'hourly' ? (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      {jobForm.vehicle === 'Tractor' ? 'Total Days' : 'Total Hours'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      required
                      value={jobForm.hours}
                      onChange={e => setJobForm({ ...jobForm, hours: e.target.value })}
                      placeholder={jobForm.vehicle === 'Tractor' ? 'e.g. 5' : 'e.g. 5.5'}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      {jobForm.vehicle === 'Tractor' ? 'Rate per Day (Rs.)' : 'Rate per Hour (Rs.)'}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={jobForm.rate_per_hour}
                      onChange={e => setJobForm({ ...jobForm, rate_per_hour: formatIndianNumberString(e.target.value) })}
                      placeholder={jobForm.vehicle === 'Tractor' ? 'e.g. 3000' : 'e.g. 800'}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Number of Loads</label>
                    <input
                      type="number"
                      inputMode="numeric"
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
                      inputMode="numeric"
                      required
                      value={jobForm.rate_per_load}
                      onChange={e => setJobForm({ ...jobForm, rate_per_load: formatIndianNumberString(e.target.value) })}
                      placeholder="e.g. 200"
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Day 1 Expenses */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Day 1 Operating Expenses</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Food Cost</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jobForm.food}
                      onChange={e => setJobForm({ ...jobForm, food: formatIndianNumberString(e.target.value) })}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Driver Bata</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jobForm.bata}
                      onChange={e => setJobForm({ ...jobForm, bata: formatIndianNumberString(e.target.value) })}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Job Diesel</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jobForm.diesel}
                      onChange={e => setJobForm({ ...jobForm, diesel: formatIndianNumberString(e.target.value) })}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Additional Charges</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jobForm.additional_charges}
                      onChange={e => setJobForm({ ...jobForm, additional_charges: formatIndianNumberString(e.target.value) })}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Other Expenses</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={jobForm.other_expenses}
                      onChange={e => setJobForm({ ...jobForm, other_expenses: formatIndianNumberString(e.target.value) })}
                      className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Days Section */}
            {jobForm.days && jobForm.days.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-left">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Additional Days Worked</label>
                <div ref={additionalDaysContainerRef} className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {jobForm.days.map((day, index) => (
                    <div key={index} className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Day {day.day_number} Details</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newDays = [...jobForm.days];
                            newDays.splice(index, 1);
                            setJobForm({ ...jobForm, days: newDays });
                          }}
                          className="text-rose-500 hover:text-rose-605 text-xs font-bold cursor-pointer"
                        >
                          Remove Day
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Day</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={day.day_number}
                            onChange={e => {
                              const newDays = [...jobForm.days];
                              newDays[index].day_number = e.target.value;
                              setJobForm({ ...jobForm, days: newDays });
                            }}
                            className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Vehicle</label>
                          <select
                            value={day.vehicle}
                            onChange={e => {
                              const newDays = [...jobForm.days];
                              newDays[index].vehicle = e.target.value;
                              setJobForm({ ...jobForm, days: newDays });
                            }}
                            className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 dark:text-slate-100 font-semibold"
                          >
                            <option value="JCB" className="dark:bg-slate-900">JCB</option>
                            <option value="Tractor" className="dark:bg-slate-900">Tractor</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Driver / Operator</label>
                          <select
                            value={day.driver_id}
                            onChange={e => {
                              const newDays = [...jobForm.days];
                              newDays[index].driver_id = e.target.value;
                              setJobForm({ ...jobForm, days: newDays });
                            }}
                            className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 dark:text-slate-100 font-semibold"
                          >
                            <option value="" className="dark:bg-slate-900">Owner Driven / None</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id} className="dark:bg-slate-900">{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Work Billing Type</label>
                          <select
                            value={day.work_type}
                            onChange={e => {
                              const newDays = [...jobForm.days];
                              newDays[index].work_type = e.target.value as any;
                              setJobForm({ ...jobForm, days: newDays });
                            }}
                            className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 dark:text-slate-100 font-semibold"
                          >
                            <option value="hourly" className="dark:bg-slate-900">
                              {day.vehicle === 'Tractor' ? 'Daily billing' : 'Hourly billing'}
                            </option>
                            <option value="loading" className="dark:bg-slate-900">Loading / Trip billing</option>
                          </select>
                        </div>
                      </div>

                      {day.work_type === 'hourly' ? (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              {day.vehicle === 'Tractor' ? 'Total Days' : 'Total Hours'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={day.hours}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].hours = e.target.value;
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              placeholder={day.vehicle === 'Tractor' ? 'e.g. 5' : 'e.g. 5.5'}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              {day.vehicle === 'Tractor' ? 'Rate/Day (Rs.)' : 'Rate/Hour (Rs.)'}
                            </label>
                            <input
                              type="text"
                              required
                              value={day.rate_per_hour}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].rate_per_hour = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              placeholder={day.vehicle === 'Tractor' ? 'e.g. 3000' : 'e.g. 800'}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Loads</label>
                            <input
                              type="number"
                              required
                              value={day.loads}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].loads = e.target.value;
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              placeholder="e.g. 10"
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Rate/Load (Rs.)</label>
                            <input
                              type="text"
                              required
                              value={day.rate_per_load}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].rate_per_load = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              placeholder="e.g. 200"
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Day Expenses */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Day {index + 2} Operating Expenses</span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Food Cost</label>
                            <input
                              type="text"
                              value={day.food}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].food = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Driver Bata</label>
                            <input
                              type="text"
                              value={day.bata}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].bata = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Job Diesel</label>
                            <input
                              type="text"
                              value={day.diesel}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].diesel = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Additional Charges</label>
                            <input
                              type="text"
                              value={day.additional_charges}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].additional_charges = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Other Expenses</label>
                            <input
                              type="text"
                              value={day.other_expenses}
                              onChange={e => {
                                const newDays = [...jobForm.days];
                                newDays[index].other_expenses = formatIndianNumberString(e.target.value);
                                setJobForm({ ...jobForm, days: newDays });
                              }}
                              className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-amber-500 font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* + Add Day Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  let nextDate = new Date().toISOString().split('T')[0];
                  let prevVehicle = jobForm.vehicle;
                  let prevDriver = jobForm.driver_id;
                  let prevWorkType = jobForm.work_type;
                  let nextDayNum = (jobForm.days.length + 2).toString();
                  
                  if (jobForm.days.length > 0) {
                    const lastDay = jobForm.days[jobForm.days.length - 1];
                    const lastDate = new Date(lastDay.date);
                    if (!isNaN(lastDate.getTime())) {
                      lastDate.setDate(lastDate.getDate() + 1);
                      nextDate = lastDate.toISOString().split('T')[0];
                    }
                    prevVehicle = lastDay.vehicle;
                    prevDriver = lastDay.driver_id;
                    prevWorkType = lastDay.work_type;
                    const lastNum = parseInt(lastDay.day_number);
                    if (!isNaN(lastNum)) {
                      nextDayNum = (lastNum + 1).toString();
                    }
                  } else {
                    const lastDate = new Date(jobForm.date);
                    if (!isNaN(lastDate.getTime())) {
                      lastDate.setDate(lastDate.getDate() + 1);
                      nextDate = lastDate.toISOString().split('T')[0];
                    }
                    const lastNum = parseInt(jobForm.day_number);
                    if (!isNaN(lastNum)) {
                      nextDayNum = (lastNum + 1).toString();
                    }
                  }
                  
                  setJobForm({
                    ...jobForm,
                    days: [
                      ...jobForm.days,
                      {
                        day_number: nextDayNum,
                        date: nextDate,
                        vehicle: prevVehicle,
                        driver_id: prevDriver,
                        work_type: prevWorkType,
                        // All billing fields start blank — user fills fresh each day
                        hours: '',
                        rate_per_hour: '',
                        loads: '',
                        rate_per_load: '',
                        food: '',
                        bata: '',
                        diesel: '',
                        additional_charges: '',
                        other_expenses: ''
                      }
                    ]
                  });
                  
                  if (jobForm.days.length >= 1) {
                    setTimeout(() => {
                      if (additionalDaysContainerRef.current) {
                        additionalDaysContainerRef.current.scrollTo({
                          top: additionalDaysContainerRef.current.scrollHeight,
                          behavior: 'smooth'
                        });
                      }
                    }, 100);
                  }
                }}
                className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl text-xs font-bold text-slate-500 hover:text-amber-500 transition cursor-pointer bg-slate-50/50 dark:bg-slate-950/20"
              >
                + Add Day
              </button>
            </div>

            {/* Payments received */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Amount Paid by Customer (Rs.)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={jobForm.amount_paid}
                  onChange={e => setJobForm({ ...jobForm, amount_paid: formatIndianNumberString(e.target.value) })}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-amber-500"
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
              disabled={savingJob}
              className={`px-4 py-2 font-bold rounded-lg transition cursor-pointer ${
                savingJob ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-500 text-slate-950 hover:bg-amber-600'
              }`}
            >
              {savingJob ? 'Saving...' : 'Save Job Bill'}
            </button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};

export default Customers;
