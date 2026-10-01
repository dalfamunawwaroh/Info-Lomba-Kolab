import api from './api';

const teamService = {
  async getTeamById(id) {
    const res = await api.get(`/teams/${id}`);
    return res.data;
  },

  async createTeam(data) {
    const res = await api.post('/teams', data);
    return res.data;
  },

  async updateTeam(id, data) {
    const res = await api.patch(`/teams/${id}`, data);
    return res.data;
  },

  async deleteTeam(id) {
    const res = await api.delete(`/teams/${id}`);
    return res.data;
  },

  async updateMembers(id, data) {
    const res = await api.patch(`/teams/${id}/members`, data);
    return res.data;
  },
};

export default teamService;
