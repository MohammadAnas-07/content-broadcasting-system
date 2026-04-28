import api from './api';

export const broadcastService = {
  async getLive(teacherId, subject = '') {
    const url = subject
      ? `/content/live/teacher-${teacherId}?subject=${encodeURIComponent(subject)}`
      : `/content/live/teacher-${teacherId}`;
    const { data } = await api.get(url);
    return data;
  },
};
