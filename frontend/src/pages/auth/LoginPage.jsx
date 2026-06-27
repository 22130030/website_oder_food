import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './AuthPage.css';

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [facebookReady, setFacebookReady] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
  if (user) {
    if (user.role === 'ADMIN') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  }
}, [user, navigate]);

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const facebookAppId = process.env.REACT_APP_FACEBOOK_APP_ID;

    if (!facebookAppId) {
      console.warn('Thiếu REACT_APP_FACEBOOK_APP_ID trong file .env');
      return;
    }

    if (window.FB) {
      setFacebookReady(true);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: facebookAppId,
        cookie: true,
        xfbml: false,
        version: 'v25.0'
      });

      setFacebookReady(true);
    };

    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

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

      login(userData, data.token, rememberMe);
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

      login(userData, data.token, rememberMe);
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

  const handleFacebookResponse = async (response) => {
    try {
      const accessToken = response?.authResponse?.accessToken;

      if (!accessToken) {
        toast.error('Bạn đã hủy đăng nhập Facebook hoặc chưa cấp quyền.');
        return;
      }

      const apiResponse = await authAPI.facebookLogin(accessToken);
      const data = apiResponse.data;

      const userData = {
        userId: data.userId || data.id,
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email
      };

      login(userData, data.token, rememberMe);
      toast.success('Đăng nhập Facebook thành công!');
      handleRedirect(data.role);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Đăng nhập Facebook thất bại!';

      setError(message);
      toast.error(message);
    } finally {
      setFacebookLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    setError('');

    if (!window.FB || !facebookReady) {
      toast.error('Facebook SDK chưa sẵn sàng. Vui lòng thử lại sau.');
      return;
    }

    setFacebookLoading(true);

    window.FB.login(
      (response) => {
        handleFacebookResponse(response);
      },
      {
        scope: 'public_profile,email'
      }
    );
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
            Đăng nhập để theo dõi đơn hàng, lưu địa chỉ giao hàng và nhận ưu đãi
            hấp dẫn mỗi ngày.
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
            <p className="auth-subtitle">
              Nhập thông tin của bạn để tiếp tục đặt món.
            </p>
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

              <div className="input-shell password-shell">
                <span className="input-icon">🔒</span>

                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="auth-login-options">
  <label className="remember-checkbox">
    <input
      type="checkbox"
      checked={rememberMe}
      onChange={(e) => setRememberMe(e.target.checked)}
    />
    <span>Ghi nhớ đăng nhập</span>
  </label>

  <Link to="/forgot-password" className="forgot-password-link">
    Quên mật khẩu?
  </Link>
</div>

            <button
              type="submit"
              className="btn btn-primary btn-full auth-submit-btn"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}
            </button>
          </form>

          <div className="auth-divider">
            <span>hoặc tiếp tục với</span>
          </div>

          <div className="google-login-wrapper">
  <GoogleLogin
    onSuccess={handleGoogleSuccess}
    onError={handleGoogleError}
    useOneTap={false}
    text="signin_with"
    shape="rectangular"
    locale="vi"
    width="430"
  />
</div>

          <div className="facebook-login-wrapper">
            <button
              type="button"
              className="facebook-login-btn"
              onClick={handleFacebookLogin}
              disabled={!facebookReady || facebookLoading}
            >
              <span className="facebook-login-icon">f</span>
              {facebookLoading ? 'Đang đăng nhập Facebook...' : 'Đăng nhập bằng Facebook'}
            </button>
          </div>

          <div className="auth-bottom-note">
            <span>Chưa có tài khoản?</span>
            <Link to="/register" className="link-primary">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
