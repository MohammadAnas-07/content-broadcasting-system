import api from './api';

export const authService = {
  async login(email, password) {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },

  async register({ name, email, password, role }) {
    const { data } = await api.post('/api/auth/register', { name, email, password, role });
    return data;
  },

  async getMe() {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};
