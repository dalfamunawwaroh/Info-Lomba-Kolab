import api from './api';

const statsService = {
  async getAdminStats() {
    const res = await api.get('/admin/stats');
    return res.data;
  },
};

export default statsService;
