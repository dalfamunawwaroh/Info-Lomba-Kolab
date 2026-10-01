import api from './api';

const historyService = {
  async getUserHistory(userId) {
    const res = await api.get(`/history/${userId}`);
    return res.data;
  },
};

export default historyService;
