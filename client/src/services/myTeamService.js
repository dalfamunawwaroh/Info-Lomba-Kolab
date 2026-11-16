import api from './api';

// Aksi mahasiswa atas tim miliknya (ketua: kelola anggota & ajukan pembimbing)
const myTeamService = {
  async getMyTeams() {
    const res = await api.get('/teams/mine');
    return res.data;
  },
  async updateByLeader(teamId, data) {
    const res = await api.patch(`/teams/${teamId}/leader`, data);
    return res.data;
  },
  async requestAdvisor(teamId, data) {
    const res = await api.post(`/teams/${teamId}/advisor-request`, data);
    return res.data;
  },
  async cancelAdvisorRequest(teamId) {
    const res = await api.delete(`/teams/${teamId}/advisor-request`);
    return res.data;
  },
  async cancelRegistration(teamId) {
    const res = await api.delete(`/teams/${teamId}/registration`);
    return res.data;
  },
  async cancelSolo(regId) {
    const res = await api.delete(`/teams/solo/${regId}`);
    return res.data;
  },
};

export default myTeamService;
