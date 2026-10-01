import api from './api';

const directoryService = {
  async getDirectory(params = {}) {
    const res = await api.get('/directory', { params });
    return res.data;
  },
};

export default directoryService;
