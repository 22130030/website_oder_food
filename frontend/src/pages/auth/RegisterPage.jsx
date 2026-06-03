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
    <div className="auth-page auth-register-page">
      <div className="auth-left">
        <div className="auth-left-decor auth-left-decor-one" />
        <div className="auth-left-decor auth-left-decor-two" />

        <div className="auth-hero">
          <span className="auth-brand-badge">🍔 NLU-FoodStack</span>
          <span className="auth-kicker">Tạo tài khoản mới thật nhanh</span>
          <h1>Bắt đầu hành trình đặt món thật tiện lợi và sinh động</h1>
          <p>
            Tạo tài khoản để lưu món yêu thích, nhận ưu đãi thành viên và theo dõi đơn hàng dễ dàng.
          </p>

          <div className="auth-highlight-grid">
            <div className="auth-highlight-card">
              <strong>Ưu đãi</strong>
              <span>Khuyến mãi mỗi ngày</span>
            </div>
            <div className="auth-highlight-card">
              <strong>Lưu nhanh</strong>
              <span>Địa chỉ giao hàng</span>
            </div>
            <div className="auth-highlight-card">
              <strong>Hỗ trợ</strong>
              <span>24/7 tận tâm</span>
            </div>
          </div>

          <div className="auth-features">
            <div className="feature-item">🥗 Khám phá thực đơn phong phú mỗi ngày</div>
            <div className="feature-item">🛵 Theo dõi trạng thái giao hàng dễ dàng</div>
            <div className="feature-item">💳 Thanh toán linh hoạt và an toàn</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container auth-form-container-wide">
          <div className="auth-panel-top">
            <span className="auth-form-badge">Tạo tài khoản mới</span>
            <h2>Đăng ký</h2>
            <p className="auth-subtitle">Điền thông tin bên dưới để bắt đầu đặt hàng.</p>
          </div>

          {error && <div className="alert alert-error">❌ {error}</div>}

          <div className="google-login-wrapper auth-google-top">
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
            <div className="auth-grid-2">
              <div className="form-group">
                <label>Họ và tên</label>
                <div className="input-shell">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Nhập họ và tên"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <div className="input-shell">
                  <span className="input-icon">📞</span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

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

            <div className="auth-grid-2">
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
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div className="input-shell">
                  <span className="input-icon">✅</span>
                  <input
                    type="password"
                    name="passwordConfirm"
                    placeholder="Nhập lại mật khẩu"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="auth-note-box">
              <strong>🎁 Quyền lợi thành viên</strong>
              <p>Lưu thông tin cá nhân, theo dõi đơn hàng và nhận thông báo ưu đãi mới nhanh hơn.</p>
            </div>

            <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="auth-bottom-note">
            <span>Đã có tài khoản?</span>
            <Link to="/login" className="link-primary">Đăng nhập ngay</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
