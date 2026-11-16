import api from './api';

const advisorService = {
  /* ------------------------------------------------------------- dashboard */
  async getSummary() {
    const res = await api.get('/advisors/summary');
    return res.data;
  },

  /* -------------------------------------------------------------- pengajuan */
  async getAdvisorRequests(params = {}) {
    const res = await api.get('/advisors/requests', { params });
    return res.data;
  },

  async respondToRequest(id, data) {
    const res = await api.patch(`/advisors/requests/${id}`, data);
    return res.data;
  },

  async selfAssign(teamId, notes = '') {
    const res = await api.post('/advisors/self-assign', { team_id: teamId, notes });
    return res.data;
  },

  async getTeamsNeedingAdvisor(params = {}) {
    const res = await api.get('/advisors/teams-needing', { params });
    return res.data;
  },

  async getMyRequests(params = {}) {
    const res = await api.get('/advisors/my-requests', { params });
    return res.data;
  },

  /* ------------------------------------------------------ tim bimbingan */
  async getMyTeams() {
    const res = await api.get('/advisors/my-teams');
    return res.data;
  },

  async getTeamDetail(teamId) {
    const res = await api.get(`/advisors/teams/${teamId}`);
    return res.data;
  },

  /* ---------------------------------------- perubahan tim (F-14, oleh dosen) */
  async createTeamChangeRequest(teamId, data) {
    const res = await api.post(`/advisors/teams/${teamId}/change-request`, data);
    return res.data;
  },

  async getMyChangeRequests(params = {}) {
    const res = await api.get('/advisors/change-requests', { params });
    return res.data;
  },

  /* ---------------------------------------------- F-10: mahasiswa → dosen */
  async requestAdvisor(teamId, advisorId, notes = '') {
    const res = await api.post('/advisors/request', { team_id: teamId, advisor_id: advisorId, notes });
    return res.data;
  },

  async getTeamAdvisorRequests(params = {}) {
    const res = await api.get('/advisors/team-requests', { params });
    return res.data;
  },

  async cancelAdvisorRequest(requestId) {
    const res = await api.post(`/advisors/requests/${requestId}/cancel`);
    return res.data;
  },

  /* ------------------------------------------------------- khusus admin */
  async assignByAdmin(data) {
    const res = await api.post('/advisors/assign', data);
    return res.data;
  },

  async replaceAdvisor(id, data) {
    const res = await api.patch(`/advisors/${id}/replace`, data);
    return res.data;
  },
};

export default advisorService;
