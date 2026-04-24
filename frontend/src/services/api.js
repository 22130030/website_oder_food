import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const adminFoodAPI = {
  getFoods: () => api.get('/admin/foods'),
  getCategories: () => api.get('/admin/categories'),
  createFood: (data) => api.post('/admin/foods', data),
  updateFood: (id, data) => api.put(`/admin/foods/${id}`, data),
  deleteFood: (id) => api.delete(`/admin/foods/${id}`),
  toggleAvailability: (id) => api.patch(`/admin/foods/${id}/availability`),
};

export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/admin/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const adminUserAPI = {
  getUsers: (keyword = '') => api.get('/admin/users', { params: { keyword } }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

export default api;