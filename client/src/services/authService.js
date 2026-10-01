import api from './api';

const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async logout(refreshToken) {
    const res = await api.post('/auth/logout', { refresh_token: refreshToken });
    return res.data;
  },

  async refreshToken(refreshToken) {
    const res = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return res.data;
  },
};

export default authService;
