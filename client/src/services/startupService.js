import api from './api';

const startupService = {
  async getStartups() {
    const res = await api.get('/startups');
    return res.data;
  },

  async createStartup(data) {
    const res = await api.post('/startups', data);
    return res.data;
  },

  async updateStartup(id, data) {
    const res = await api.patch(`/startups/${id}`, data);
    return res.data;
  },

  async deleteStartup(id) {
    const res = await api.delete(`/startups/${id}`);
    return res.data;
  },
};

export default startupService;
