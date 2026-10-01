import api from './api';

const submissionService = {
  async getSubmissions(params = {}) {
    const res = await api.get('/submissions', { params });
    return res.data;
  },

  async respondToSubmission(id, data) {
    const res = await api.patch(`/submissions/${id}`, data);
    return res.data;
  },
};

export default submissionService;
