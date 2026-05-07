import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  register: (data: any) => API.post('/auth/register', data),
  login: (data: any) => API.post('/auth/login', data),
  demoLogin: () => API.post('/auth/demo'),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data: any) => API.put('/auth/profile', data),
};

export const interviewAPI = {
  start: (data: any) => API.post('/interview/start', data),
  getQuestion: (params: any) => API.get('/interview/question', { params }),
  evaluate: (data: any) => API.post('/interview/evaluate', data),
  complete: (data: any) => API.post('/interview/complete', data),
  getHistory: (params?: any) => API.get('/interview/history', { params }),
  getSession: (sessionId: string) => API.get(`/interview/${sessionId}`),
};

export const resumeAPI = {
  analyze: (data: any) => API.post('/resume/analyze', data),
  generateQuestions: (data: any) => API.post('/resume/questions', data),
};

export const analyticsAPI = {
  getDashboard: () => API.get('/analytics/dashboard'),
  getLeaderboard: () => API.get('/analytics/leaderboard'),
};

export default API;
