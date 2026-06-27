import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const getSavedToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getSavedUser = () => {
  return localStorage.getItem('user') || sessionStorage.getItem('user');
};

const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
};

const getCurrentStorage = () => {
  if (localStorage.getItem('token')) {
    return localStorage;
  }

  if (sessionStorage.getItem('token')) {
    return sessionStorage;
  }

  return localStorage;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getSavedToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = getSavedUser();

    try {
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Không thể đọc thông tin đăng nhập:', error);
      clearAuthStorage();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, jwtToken, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    clearAuthStorage();

    storage.setItem('user', JSON.stringify(userData));
    storage.setItem('token', jwtToken);

    setUser(userData);
    setToken(jwtToken);
  };

  const logout = () => {
    clearAuthStorage();
    setUser(null);
    setToken(null);
  };

  const updateUser = (updatedUser) => {
    const storage = getCurrentStorage();

    storage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be inside AuthProvider');
  }

  return ctx;
};
