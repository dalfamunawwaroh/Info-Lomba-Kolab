import api from './api';

// Admin: kelola permintaan reset password & pengiriman kode verifikasi via email
const resetService = {
  async list(status) {
    const params = status ? { status } : {};
    const res = await api.get('/admin/resets', { params });
    return res.data;
  },

  async sendCode(id) {
    const res = await api.post(`/admin/resets/${id}/send-code`);
    return res.data;
  },

  async cancel(id) {
    const res = await api.post(`/admin/resets/${id}/cancel`);
    return res.data;
  },
};

export default resetService;
