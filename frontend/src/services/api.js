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
  // Gửi idToken (credential) từ Google lên backend để xác thực
  googleLogin: (idToken) => api.post('/auth/google', { idToken })
};

export const foodAPI = {
  getFoods: (params = {}) => api.get('/foods', { params }),
  getFoodById: (id) => api.get(`/foods/${id}`),
  getCategories: () => api.get('/categories'),
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
export const getFoods = (params = {}) => api.get('/foods', { params });

export const adminUserAPI = {
  getUsers: (keyword = '') => api.get('/admin/users', { params: { keyword } }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  toggleActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

export const chatAPI = {
  getMessagesByCustomer: (customerId) => api.get(`/chat/customer/${customerId}`),
  getConversations: () => api.get('/chat/admin/conversations'),

  getAdminUnreadCount: () => api.get('/chat/admin/unread-count'),
  getCustomerUnreadCount: (customerId) => api.get(`/chat/customer/${customerId}/unread-count`),

  markAdminConversationRead: (customerId) =>
    api.patch(`/chat/admin/conversations/${customerId}/read`),

  markCustomerChatRead: (customerId) =>
    api.patch(`/chat/customer/${customerId}/read`),

  uploadChatImage: (formData) =>
    api.post('/chat/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};
export const profileAPI = {
  getProfile: (userId) => api.get(`/profile/${userId}`),

  updateProfile: (userId, data) => api.put(`/profile/${userId}`, data),

  uploadAvatar: (formData) =>
    api.post('/profile/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  changePassword: (data) => api.put('/profile/change-password', data),
};

export default api;