import api from './api';

export const approvalService = {
  async getPending({ page = 1, limit = 10 } = {}) {
    const { data } = await api.get(`/api/approval/pending?page=${page}&limit=${limit}`);
    return data;
  },

  async getAll({ page = 1, limit = 10, status = '', subject = '', teacherId = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (subject) params.set('subject', subject);
    if (teacherId) params.set('teacherId', teacherId);
    const { data } = await api.get(`/api/approval/all?${params}`);
    return data;
  },

  async approve(id) {
    const { data } = await api.patch(`/api/approval/${id}/approve`);
    return data;
  },

  async reject(id, rejectionReason) {
    const { data } = await api.patch(`/api/approval/${id}/reject`, { rejectionReason });
    return data;
  },
};
