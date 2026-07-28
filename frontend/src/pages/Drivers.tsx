import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  IndianRupee, 
  FileDown, 
  Calendar,
  Phone,
  Users,
  Eye,
  Share2,
  AlertCircle
} from 'lucide-react';
import { driversService } from '../services/drivers';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '../components/UI/Dialog';
import { formatIndianNumberString, parseIndianNumberString } from '../utils/format';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>({ payments: [], monthly_total: 0, yearly_total: 0 });
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  
  // Modals state
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  // Forms state
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [driverForm, setDriverForm] = useState({ id: null, name: '', phone: '', joining_date: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: '', notes: '' });
  const [pdfForm, setPdfForm] = useState({ range_type: 'month', start_date: '', end_date: '' });
  const [driverError, setDriverError] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const data = await driversService.getDrivers();
      setDrivers(data);
      if (data.length > 0 && !selectedDriver) {
        selectDriver(data[0], false);
      }
    } catch (err) {
      console.error('Error fetching drivers', err);
    } finally {
      setLoading(false);
    }
  };

  const selectDriver = async (driver: any, shouldSwitchMode = true) => {
    setSelectedDriver(driver);
    if (shouldSwitchMode) {
      setViewMode('detail');
    }
    try {
      setPaymentsLoading(true);
      const data = await driversService.getPayments(driver.id);
      setPaymentsData(data);
    } catch (err) {
      console.error('Error fetching payments', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAddDriver = () => {
    setDriverForm({ id: null, name: '', phone: '', joining_date: new Date().toISOString().split('T')[0] });
    setDriverError('');
    setIsDriverModalOpen(true);
  };

  const handleOpenEditDriver = (driver: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDriverForm({ id: driver.id, name: driver.name, phone: driver.phone, joining_date: driver.joining_date });
    setDriverError('');
    setIsDriverModalOpen(true);
  };

  const handleSaveDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name || !driverForm.joining_date) return;
    
    setDriverError('');
    try {
      if (driverForm.id) {
        const updated = await driversService.editDriver(driverForm.id, driverForm);
        setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
        if (selectedDriver?.id === updated.id) setSelectedDriver(updated);
      } else {
        const added = await driversService.addDriver(driverForm);
        setDrivers(prev => [...prev, added]);
        if (!selectedDriver) selectDriver(added);
      }
      setIsDriverModalOpen(false);
    } catch (err: any) {
      console.error('Error saving driver', err);
      setDriverError(err.response?.data?.message || err.message || 'Failed to save driver details. Please try again.');
    }
  };

  const handleDeleteDriver = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this driver? All payment history will be lost.')) return;
    
    try {
      await driversService.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      if (selectedDriver?.id === id) {
        setSelectedDriver(null);
        setPaymentsData({ payments: [], monthly_total: 0, yearly_total: 0 });
      }
    } catch (err) {
      console.error('Error deleting driver', err);
    }
  };

  const handleOpenAddPayment = () => {
    setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !paymentForm.amount || !paymentForm.date) return;

    setPaymentError('');
    try {
      await driversService.addPayment(selectedDriver.id, {
        amount: parseIndianNumberString(paymentForm.amount),
        date: paymentForm.date,
        notes: paymentForm.notes
      });
      // Refresh payments list
      selectDriver(selectedDriver);
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      console.error('Error saving payment', err);
      setPaymentError(err.response?.data?.message || err.message || 'Failed to log payment.');
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!window.confirm('Delete this payment entry?')) return;
    try {
      await driversService.deletePayment(paymentId);
      selectDriver(selectedDriver);
    } catch (err) {
      console.error('Error deleting payment', err);
    }
  };

  const handleDownloadPdf = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDriver) return;
    try {
      await driversService.downloadDriverBill(selectedDriver.id, pdfForm, selectedDriver.name);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Error exporting PDF', err);
    }
  };

  const handleViewPdf = async () => {
    if (!selectedDriver) return;
    try {
      await driversService.viewDriverBill(selectedDriver.id, pdfForm);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Error viewing PDF', err);
    }
  };

  const handleShareDriverWhatsApp = () => {
    if (!selectedDriver) return;
    
    let filtered = [...paymentsData.payments];
    const { range_type, start_date, end_date } = pdfForm;
    const todayStr = new Date().toISOString().split('T')[0];
    let periodStr = 'All Time';
    
    if (range_type === 'today') {
      filtered = paymentsData.payments.filter((p: any) => p.date === todayStr);
      periodStr = `Today (${todayStr})`;
    } else if (range_type === 'month') {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      filtered = paymentsData.payments.filter((p: any) => p.date.startsWith(currentMonth));
      periodStr = `Current Month (${currentMonth})`;
    } else if (range_type === 'custom' && start_date && end_date) {
      filtered = paymentsData.payments.filter((p: any) => p.date >= start_date && p.date <= end_date);
      periodStr = `${start_date} to ${end_date}`;
    }
    
    const totalPaid = filtered.reduce((sum: number, p: any) => sum + p.amount, 0);
    const lastPayment = filtered.length > 0 ? filtered[0] : null;
    
    let text = `*Driver Payment Statement*\n\n`;
    text += `*Driver:* ${selectedDriver.name}\n`;
    text += `*Period:* ${periodStr}\n`;
    text += `---------------------------\n`;
    text += `*Total Amount Received:* Rs. ${totalPaid.toLocaleString('en-IN')}\n`;
    if (lastPayment) {
      text += `*Last Payment:* Rs. ${lastPayment.amount.toLocaleString('en-IN')} on ${lastPayment.date}\n`;
    }
    text += `---------------------------\n`;
    text += `*Statement details:* \n`;
    filtered.slice(0, 10).forEach((p: any) => {
      text += `- ${p.date}: Rs. ${p.amount.toLocaleString('en-IN')} (${p.notes || 'No notes'})\n`;
    });
    if (filtered.length > 10) {
      text += `- ... and ${filtered.length - 10} more entries\n`;
    }
    text += `\nThank you!`;
    
    const encodedText = encodeURIComponent(text);
    
    let phone = selectedDriver.phone || '';
    phone = phone.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
    setIsPdfModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Driver Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">Manage personnel, payment logs, and generate reports</p>
        </div>
        <button
          onClick={handleOpenAddDriver}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus size={18} className="stroke-[2.5]" /> Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DRIVERS LIST */}
        <div className={`${viewMode === 'list' ? 'block' : 'hidden'} lg:block bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4`}>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Drivers</h2>
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">Loading drivers...</div>
          ) : drivers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-sm">No drivers found. Add one to get started!</div>
          ) : (
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {drivers.map(driver => (
                <div
                  key={driver.id}
                  onClick={() => selectDriver(driver)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer text-left ${
                    selectedDriver?.id === driver.id
                      ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                      : 'bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-100 dark:border-slate-800/40'
                  }`}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">{driver.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-1">
                      <Phone size={12} /> {driver.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={(e) => handleOpenEditDriver(driver, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
                      title="Edit driver"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteDriver(driver.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition"
                      title="Delete driver"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILED VIEW - PAYMENTS & JOBS */}
        <div className={`${viewMode === 'detail' ? 'block' : 'hidden'} lg:block lg:col-span-2 space-y-6`}>
          {selectedDriver ? (
            <div className="space-y-6">
              {/* Back button on mobile */}
              <button
                onClick={() => setViewMode('list')}
                className="lg:hidden flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer pb-1"
              >
                ← Back to Driver List
              </button>

              {/* Selected Driver Banner Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider">Driver File</span>
                  <h2 className="text-xl font-extrabold mt-1">{selectedDriver.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-semibold mt-1">
                    <span className="flex items-center gap-1"><Phone size={12} /> {selectedDriver.phone}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Joined {selectedDriver.joining_date}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPdfModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <FileDown size={14} /> Print Bill PDF
                  </button>
                  <button
                    onClick={handleOpenAddPayment}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-90 transition cursor-pointer"
                  >
                    <IndianRupee size={14} /> Add Amount
                  </button>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 shadow-sm text-left">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Monthly Total Paid</span>
                  <p className="text-xl font-black mt-2 text-slate-800 dark:text-slate-100">
                    Rs. {paymentsData.monthly_total?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-xl p-5 shadow-sm text-left">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Yearly Total Paid</span>
                  <p className="text-xl font-black mt-2 text-slate-800 dark:text-slate-100">
                    Rs. {paymentsData.yearly_total?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Payment History List */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider text-left">Payment History</h2>
                {paymentsLoading ? (
                  <div className="py-8 text-center text-slate-400 font-semibold text-xs animate-pulse">Loading payments logs...</div>
                ) : paymentsData.payments?.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-semibold text-sm">No payment records saved yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 font-bold text-slate-400 text-xs">
                          <th className="py-2.5">Date</th>
                          <th className="py-2.5">Notes</th>
                          <th className="py-2.5 text-right">Amount</th>
                          <th className="py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {paymentsData.payments.map((p: any) => (
                          <tr key={p.id} className="text-slate-700 dark:text-slate-300">
                            <td className="py-3 font-semibold">{p.date}</td>
                            <td className="py-3 max-w-[200px] truncate">{p.notes || 'Regular payment'}</td>
                            <td className="py-3 text-right font-bold text-slate-900 dark:text-white">Rs. {p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="py-3 text-center">
                              <button 
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 transition"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[50vh]">
              <Users size={48} className="text-slate-300 dark:text-slate-700 stroke-[1.5] mb-4" />
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Driver Selected</h2>
              <p className="text-sm text-slate-400 font-semibold max-w-sm mt-1">Select a driver from the left sidebar or create a new driver profile to record payment data.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- ADD/EDIT DRIVER MODAL --- */}
      <Dialog isOpen={isDriverModalOpen} onClose={() => setIsDriverModalOpen(false)}>
        <form onSubmit={handleSaveDriver}>
          <DialogHeader>
            <DialogTitle>{driverForm.id ? 'Edit Driver Details' : 'Add New Driver Profile'}</DialogTitle>
          </DialogHeader>
          {driverError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{driverError}</span>
            </div>
          )}
          <div className="space-y-4 py-2 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Driver Name</label>
              <input
                type="text"
                required
                value={driverForm.name}
                onChange={e => setDriverForm({ ...driverForm, name: e.target.value })}
                placeholder="Enter driver's full name"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Phone Number <span className="normal-case text-slate-300 dark:text-slate-600 font-medium">(Optional)</span></label>
              <input
                type="text"
                value={driverForm.phone}
                onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })}
                placeholder="Enter contact number (optional)"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Joining Date</label>
              <input
                type="date"
                required
                value={driverForm.joining_date}
                onChange={e => setDriverForm({ ...driverForm, joining_date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsDriverModalOpen(false)}
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

      {/* --- ADD PAYMENT MODAL --- */}
      <Dialog isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)}>
        <form onSubmit={handleSavePayment}>
          <DialogHeader>
            <DialogTitle>Add Amount for {selectedDriver?.name}</DialogTitle>
          </DialogHeader>
          {paymentError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}
          <div className="space-y-4 py-2 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Payment Amount (Rs.)</label>
              <input
                type="text"
                required
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: formatIndianNumberString(e.target.value) })}
                placeholder="e.g. 10,000"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Payment Date</label>
              <input
                type="date"
                required
                value={paymentForm.date}
                onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Notes / Remarks</label>
              <input
                type="text"
                value={paymentForm.notes}
                onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                placeholder="e.g. Salary advance, weekly settlement"
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg hover:opacity-90 transition cursor-pointer"
            >
              Save Amount
            </button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* --- EXPORT BILL PDF MODAL --- */}
      <Dialog isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)}>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>Print Driver Bill Statement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Date Range Type</label>
              <select
                value={pdfForm.range_type}
                onChange={e => setPdfForm({ ...pdfForm, range_type: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 dark:text-slate-100"
              >
                <option value="today" className="dark:bg-slate-900">Today</option>
                <option value="month" className="dark:bg-slate-900">Current Month</option>
                <option value="custom" className="dark:bg-slate-900">Custom Date Range</option>
                <option value="all" className="dark:bg-slate-900">All Time History</option>
              </select>
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
            <button
              type="button"
              onClick={handleViewPdf}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <Eye size={14} /> View Bill
            </button>
            <button
              type="button"
              onClick={() => handleDownloadPdf()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition cursor-pointer"
            >
              <FileDown size={14} /> Download PDF
            </button>
            <button
              type="button"
              onClick={handleShareDriverWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition cursor-pointer"
            >
              <Share2 size={14} /> Share WhatsApp
            </button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
};

export default Drivers;
