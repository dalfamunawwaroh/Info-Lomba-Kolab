import api from './api';

const broadcastService = {
  async getBroadcasts(params = {}) {
    const res = await api.get('/broadcasts', { params });
    return res.data;
  },

  async createBroadcast(data) {
    const res = await api.post('/broadcasts', data);
    return res.data;
  },

  async deleteBroadcast(id) {
    const res = await api.delete(`/broadcasts/${id}`);
    return res.data;
  },
};

export default broadcastService;
