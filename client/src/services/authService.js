import api from './api';

const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  // Cek email/NIM duplikat sebelum pindah step (dipakai step Data Diri)
  async checkAvailability({ email, nip_nim }) {
    const res = await api.post('/auth/check-availability', { email, nip_nim });
    return res.data?.data || res.data;
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

  // Langkah 1: user ajukan reset lewat email terdaftar (menunggu admin kirim kode)
  async requestPasswordReset(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  // Langkah 3: user masukkan kode verifikasi dari email + password baru
  async resetPassword({ email, code, password }) {
    const res = await api.post('/auth/reset-password', { email, code, password });
    return res.data;
  },
};

export default authService;
