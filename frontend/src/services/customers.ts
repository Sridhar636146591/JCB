import api from './api';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  village: string;
  created_at?: string;
}

export interface CustomerJob {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  customer_village?: string;
  driver_id?: number | null;
  driver_name?: string;
  date: string;
  vehicle: string;
  work_type: 'hourly' | 'loading';
  hours?: number;
  rate_per_hour?: number;
  loads?: number;
  rate_per_load?: number;
  food: number;
  bata: number;
  diesel: number;
  additional_charges: number;
  other_expenses: number;
  amount_paid: number;
  total_amount?: number;
  total_expenses?: number;
  net_profit?: number;
  balance?: number;
  notes?: string;
}

export const customersService = {
  async getCustomers(search: string = '') {
    const response = await api.get('/customers', { params: { search } });
    return response.data;
  },

  async addCustomer(customer: { name: string; phone: string; village: string }) {
    const response = await api.post('/customers', customer);
    return response.data;
  },

  async editCustomer(id: number, customer: { name: string; phone: string; village: string }) {
    const response = await api.put(`/customers/${id}`, customer);
    return response.data;
  },

  async deleteCustomer(id: number) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  async getCustomerJobs(customerId: number) {
    const response = await api.get(`/customers/${customerId}/jobs`);
    return response.data;
  },

  async addCustomerJob(customerId: number, job: any) {
    const response = await api.post(`/customers/${customerId}/jobs`, job);
    return response.data;
  },

  async editCustomerJob(jobId: number, job: any) {
    const response = await api.put(`/customers/jobs/${jobId}`, job);
    return response.data;
  },

  async deleteCustomerJob(jobId: number) {
    const response = await api.delete(`/customers/jobs/${jobId}`);
    return response.data;
  },

  async downloadInvoice(jobId: number, customerName: string, dateStr: string) {
    const response = await api.get(`/customers/jobs/${jobId}/pdf`, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Invoice_${customerName.replace(/\s+/g, '_')}_${dateStr}.pdf`;
    link.click();
    window.URL.revokeObjectURL(link.href);
  },

  async viewInvoice(jobId: number) {
    const response = await api.get(`/customers/jobs/${jobId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = window.URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  }
};
