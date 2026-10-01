import api from './api';

const competitionService = {
  async getCompetitions(params = {}) {
    const res = await api.get('/competitions', { params });
    return res.data;
  },

  async getCompetitionById(id) {
    const res = await api.get(`/competitions/${id}`);
    return res.data;
  },

  async createCompetition(data) {
    const res = await api.post('/competitions', data);
    return res.data;
  },

  async updateCompetition(id, data) {
    const res = await api.patch(`/competitions/${id}`, data);
    return res.data;
  },

  async deleteCompetition(id) {
    const res = await api.delete(`/competitions/${id}`);
    return res.data;
  },

  async registerToCompetition(id, data) {
    const res = await api.post(`/competitions/${id}/register`, data);
    return res.data;
  },

  async getSoloRegistrations(id) {
    const res = await api.get(`/competitions/${id}/solo`);
    return res.data;
  },
};

export default competitionService;
