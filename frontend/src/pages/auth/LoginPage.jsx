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
        userId: data.userId || data.id,
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
        userId: data.userId || data.id,
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
    <div className="auth-page auth-login-page">
      <div className="auth-left">
        <div className="auth-left-decor auth-left-decor-one" />
        <div className="auth-left-decor auth-left-decor-two" />

        <div className="auth-hero">
          <span className="auth-brand-badge">🍔 NLU-FoodStack</span>
          <span className="auth-kicker">Đăng nhập để đặt món nhanh hơn</span>
          <h1>Thưởng thức món ngon chỉ với vài bước đơn giản</h1>
          <p>
            Đăng nhập để theo dõi đơn hàng, lưu địa chỉ giao hàng và nhận ưu đãi hấp dẫn mỗi ngày.
          </p>

          <div className="auth-highlight-grid">
            <div className="auth-highlight-card">
              <strong>30 phút</strong>
              <span>Giao nhanh tận nơi</span>
            </div>
            <div className="auth-highlight-card">
              <strong>200+</strong>
              <span>Món ăn hấp dẫn</span>
            </div>
            <div className="auth-highlight-card">
              <strong>4.8★</strong>
              <span>Khách hàng yêu thích</span>
            </div>
          </div>

          <div className="auth-features">
            <div className="feature-item">✅ Đặt món nhanh, giao hàng tiện lợi</div>
            <div className="feature-item">🎁 Nhận ưu đãi dành riêng cho thành viên</div>
            <div className="feature-item">🔒 Thanh toán an toàn, bảo mật</div>
            <div className="feature-item">💬 Hỗ trợ 24/7 khi bạn cần</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-panel-top">
            <span className="auth-form-badge">Chào mừng quay lại</span>
            <h2>Đăng nhập</h2>
            <p className="auth-subtitle">Nhập thông tin của bạn để tiếp tục đặt món.</p>
          </div>

          {error && <div className="alert alert-error">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <div className="input-shell">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="input-shell">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="auth-inline-row">
              <Link to="/forgot-password" className="link-primary">
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
            </button>
          </form>

          <div className="auth-divider"><span>hoặc tiếp tục với</span></div>

          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              text="signin_with"
              shape="rectangular"
              locale="vi"
              width="350"
            />
          </div>

          <div className="auth-bottom-note">
            <span>Chưa có tài khoản?</span>
            <Link to="/register" className="link-primary">Đăng ký ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
