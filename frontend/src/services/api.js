// API service for authentication and other requests
const API_BASE_URL = 'http://localhost:5000'; // Change this to your actual API URL

export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const error = await response.json();
        const err = new Error(error.message || 'Login failed');
        err.response = { data: error };
        throw err;
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        const err = new Error(error.message || 'Registration failed');
        err.response = { data: error };
        throw err;
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};

export default authAPI;
