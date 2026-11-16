import api from './api';

/**
 * Pendaftaran solo — mahasiswa yang mendaftar lomba tanpa tim.
 * Admin harus membentuk tim dari pendaftar ini (F-08).
 */
const registrationService = {
  /**
   * @param {{ status?: 'waiting'|'assigned'|'rejected', competition_id?: number|string }} params
   * @returns {Promise<{success: boolean, data: Array, meta: object}>}
   */
  async getRegistrations(params = {}) {
    const res = await api.get('/registrations', { params });
    return res.data;
  },

  /**
   * Bentuk tim baru dari satu pendaftar solo.
   * @param {number|string} id  id pendaftaran
   * @param {{ team_name?: string }} data
   */
  async assignRegistration(id, data = {}) {
    const res = await api.post(`/registrations/${id}/assign`, data);
    return res.data;
  },
};

export default registrationService;
