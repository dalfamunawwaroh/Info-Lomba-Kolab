import api from './api';

const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data;
  },
  async markAllRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};

export default notificationService;
