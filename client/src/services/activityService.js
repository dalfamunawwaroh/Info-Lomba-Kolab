import api from './api';

const activityService = {
  async getActivities(params = {}) {
    const res = await api.get('/activities', { params });
    return res.data;
  },
};

export default activityService;
