import api from './api';

const userService = {
  async getUsers(params = {}) {
    const res = await api.get('/users', { params });
    return res.data;
  },

  async getUserById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data;
  },

  async createUser(data) {
    const res = await api.post('/users', data);
    return res.data;
  },

  async updateUser(id, data) {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },

  async deactivateUser(id) {
    const res = await api.patch(`/users/${id}/deactivate`);
    return res.data;
  },

  async activateUser(id) {
    const res = await api.patch(`/users/${id}/activate`);
    return res.data;
  },
};

export default userService;
