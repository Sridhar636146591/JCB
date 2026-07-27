import api from './api';

export interface FuelEntry {
  id: number;
  date: string;
  vehicle: string;
  litres?: number;
  price_per_litre?: number;
  total_cost?: number;
  notes?: string;
}

export const fuelService = {
  async getFuelEntries(params?: { start_date?: string; end_date?: string }) {
    const response = await api.get('/fuel', { params });
    return response.data;
  },

  async addFuelEntry(entry: { date: string; vehicle: string; amount: number; litres?: number; price_per_litre?: number; notes?: string }) {
    const response = await api.post('/fuel', entry);
    return response.data;
  },

  async editFuelEntry(id: number, entry: { date: string; vehicle: string; amount: number; litres?: number; price_per_litre?: number; notes?: string }) {
    const response = await api.put(`/fuel/${id}`, entry);
    return response.data;
  },

  async deleteFuelEntry(id: number) {
    const response = await api.delete(`/fuel/${id}`);
    return response.data;
  },

  async downloadFuelReport(params: { range_type: string; start_date?: string; end_date?: string }) {
    const response = await api.get('/fuel/pdf', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Fuel_Report_${params.range_type}.pdf`;
    link.click();
    window.URL.revokeObjectURL(link.href);
  },

  async viewFuelReport(params: { range_type: string; start_date?: string; end_date?: string }) {
    const response = await api.get('/fuel/pdf', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  }
};
