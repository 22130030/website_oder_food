import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './AuthPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRedirect = (role) => {
    setTimeout(() => {
      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      const data = response.data;
      const userData = {
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email
      };

      login(userData, data.token);
      toast.success('Đăng nhập thành công!');
      handleRedirect(data.role);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Email hoặc mật khẩu không đúng!';

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authAPI.googleLogin(credentialResponse.credential);
      const data = response.data;

      const userData = {
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email
      };

      login(userData, data.token);
      toast.success('Đăng nhập Google thành công!');
      handleRedirect(data.role);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Đăng nhập Google thất bại!';
      setError(message);
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    toast.error('Đăng nhập Google thất bại. Vui lòng thử lại!');
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-hero">
          <div className="auth-hero-icon">🍔</div>
          <h1>NLU-FoodStack</h1>
          <p>Đặt đồ ăn ngon, giao hàng nhanh chóng tận nơi!</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Đăng nhập</h2>
          <p className="auth-subtitle">Chào mừng bạn quay lại!</p>

          {error && <div className="alert alert-error">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <input
                type="password"
                name="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>

          <div className="auth-divider"><span>hoặc</span></div>

          {/* Nút đăng nhập Google */}
          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              locale="vi"
              width="100%"
            />
          </div>

          <p className="auth-switch" style={{ marginTop: '16px' }}>
            Chưa có tài khoản? <Link to="/register" className="link-primary">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
