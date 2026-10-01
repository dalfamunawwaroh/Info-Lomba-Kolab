import api from './api';

const advisorService = {
  async getAdvisorRequests(params = {}) {
    const res = await api.get('/advisors/requests', { params });
    return res.data;
  },

  async respondToRequest(id, data) {
    const res = await api.patch(`/advisors/requests/${id}`, data);
    return res.data;
  },

  async selfAssign(teamId) {
    const res = await api.post('/advisors/self-assign', { team_id: teamId });
    return res.data;
  },

  async assignByAdmin(data) {
    const res = await api.post('/advisors/assign', data);
    return res.data;
  },

  async replaceAdvisor(id, data) {
    const res = await api.patch(`/advisors/${id}/replace`, data);
    return res.data;
  },

  async getMyTeams() {
    const res = await api.get('/advisors/my-teams');
    return res.data;
  },
};

export default advisorService;
