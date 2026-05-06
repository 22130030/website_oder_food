import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './AuthPage.css';

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('Mật khẩu xác nhận không khớp!');
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password
      });

      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Đăng ký thất bại!';

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
        userId: data.userId || data.id,
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email
      };

      login(userData, data.token);
      toast.success('Đăng nhập Google thành công!');
      setTimeout(() => {
        navigate('/home');
      }, 1000);
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
          <div className="auth-features">
            <div className="feature-item">✅ Hơn 200+ món ăn đa dạng</div>
            <div className="feature-item">🚀 Giao hàng trong 30 phút</div>
            <div className="feature-item">🔒 Thanh toán an toàn, bảo mật</div>
            <div className="feature-item">💬 Hỗ trợ 24/7</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Đăng ký</h2>
          <p className="auth-subtitle">Tạo tài khoản để bắt đầu đặt hàng!</p>

          {error && <div className="alert alert-error">❌ {error}</div>}

          {/* Đăng nhập Google nhanh — đặt trên đầu cho tiện */}
          <div className="google-login-wrapper" style={{ marginBottom: '16px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="signup_with"
              shape="rectangular"
              locale="vi"
              width="100%"
            />
          </div>

          <div className="auth-divider"><span>hoặc đăng ký bằng email</span></div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                name="fullName"
                placeholder="Nhập họ và tên"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

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
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                placeholder="Nhập số điện thoại"
                value={form.phone}
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
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                name="passwordConfirm"
                placeholder="Nhập lại mật khẩu"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Đang đăng ký...' : '🚀 Đăng ký'}
            </button>
          </form>

          <p className="auth-switch" style={{ marginTop: '16px' }}>
            Đã có tài khoản? <Link to="/login" className="link-primary">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
