import api from './api';

export const contentService = {
  async upload(formData, onUploadProgress) {
    const { data } = await api.post('/api/content/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data;
  },

  async getMyContent({ page = 1, limit = 10, status = '', subject = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (subject) params.set('subject', subject);
    const { data } = await api.get(`/api/content/my-content?${params}`);
    return data;
  },

  async getById(id) {
    const { data } = await api.get(`/api/content/${id}`);
    return data;
  },
};
