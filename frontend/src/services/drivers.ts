import api from './api';

export const driversService = {
  async getDrivers() {
    const response = await api.get('/drivers');
    return response.data;
  },

  async addDriver(driver: { name: string; phone: string; joining_date: string }) {
    const response = await api.post('/drivers', driver);
    return response.data;
  },

  async editDriver(id: number, driver: { name: string; phone: string; joining_date: string }) {
    const response = await api.put(`/drivers/${id}`, driver);
    return response.data;
  },

  async deleteDriver(id: number) {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },

  async getPayments(driverId: number) {
    const response = await api.get(`/drivers/${driverId}/payments`);
    return response.data;
  },

  async addPayment(driverId: number, payment: { amount: number; date: string; notes?: string }) {
    const response = await api.post(`/drivers/${driverId}/payments`, payment);
    return response.data;
  },

  async deletePayment(paymentId: number) {
    const response = await api.delete(`/drivers/payments/${paymentId}`);
    return response.data;
  },

  getDriverBillPdfUrl(driverId: number, params: { range_type: string; start_date?: string; end_date?: string }) {
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token') || '';
    
    let url = `${baseUrl}/drivers/${driverId}/pdf?token=${token}&range_type=${params.range_type}`;
    if (params.start_date) url += `&start_date=${params.start_date}`;
    if (params.end_date) url += `&end_date=${params.end_date}`;
    
    return url;
  },

  async downloadDriverBill(driverId: number, params: { range_type: string; start_date?: string; end_date?: string }, driverName: string) {
    const response = await api.get(`/drivers/${driverId}/pdf`, {
      params,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Driver_Bill_${driverName.replace(/\s+/g, '_')}.pdf`;
    link.click();
    window.URL.revokeObjectURL(link.href);
  },

  async viewDriverBill(driverId: number, params: { range_type: string; start_date?: string; end_date?: string }) {
    const response = await api.get(`/drivers/${driverId}/pdf`, {
      params,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = window.URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  }
};
