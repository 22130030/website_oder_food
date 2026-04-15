import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './AuthPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSocialLogin = (provider) => {
    alert(`Đăng nhập bằng ${provider === 'google' ? 'Google' : 'Facebook'} (tính năng đang phát triển)`);
    // TODO: Integrate Google/Facebook OAuth
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.user, res.data.token);
      alert('Đăng nhập thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
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
          <h2>Đăng nhập</h2>
          <p className="auth-subtitle">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>

          {error && <div className="alert alert-error">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" placeholder="example@email.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Mật khẩu</label>
              <input type="password" name="password" placeholder="Nhập mật khẩu" value={form.password} onChange={handleChange} required />
              <div className="text-right mt-1">
                <Link to="/forgot-password" className="link-primary">Quên mật khẩu?</Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>

          <div className="social-login">
            <button type="button" className="btn-social btn-google" onClick={() => handleSocialLogin('google')}>
              <span>🔍</span> Google
            </button>
            <button type="button" className="btn-social btn-facebook" onClick={() => handleSocialLogin('facebook')}>
              <span>📘</span> Facebook
            </button>
          </div>

          <div className="auth-divider"><span>hoặc</span></div>
          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register" className="link-primary">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
