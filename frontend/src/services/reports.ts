import api from './api';

export const reportsService = {
  async getDashboard() {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  async getFinancial(params: { start_date: string; end_date: string }) {
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },

  async downloadFinancialReport(params: { range_type: string; start_date?: string; end_date?: string }) {
    const response = await api.get('/reports/export-pdf', {
      params,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Financial_Report_${params.range_type}.pdf`;
    link.click();
    window.URL.revokeObjectURL(link.href);
  },

  async viewFinancialReport(params: { range_type: string; start_date?: string; end_date?: string }) {
    const response = await api.get('/reports/export-pdf', {
      params,
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = window.URL.createObjectURL(blob);
    window.open(fileURL, '_blank');
  }
};
