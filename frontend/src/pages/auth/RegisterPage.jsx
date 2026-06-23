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

  const [step, setStep] = useState('register');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

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
      const email = form.email.trim().toLowerCase();

      await authAPI.register({
        fullName: form.fullName.trim(),
        email,
        phone: form.phone.trim(),
        password: form.password
      });

      setRegisteredEmail(email);
      setStep('verify');
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để lấy mã xác thực.');
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

  const handleVerifyRegisterCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!verifyCode || verifyCode.trim().length !== 6) {
      setError('Vui lòng nhập mã xác thực gồm 6 chữ số');
      toast.error('Vui lòng nhập mã xác thực gồm 6 chữ số');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyRegisterCode({
        email: registeredEmail,
        code: verifyCode.trim()
      });

      const data = response.data;

      const userData = {
        userId: data.userId || data.id,
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email
      };

      login(userData, data.token);
      toast.success('Xác thực email thành công!');
      navigate('/home');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Xác thực thất bại!';

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
      navigate('/home');
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
            <span className="auth-form-badge">
              {step === 'register' ? 'Tạo tài khoản mới' : 'Xác thực email'}
            </span>

            <h2>{step === 'register' ? 'Đăng ký' : 'Nhập mã xác thực'}</h2>

            <p className="auth-subtitle">
              {step === 'register'
                ? 'Điền thông tin bên dưới để bắt đầu đặt hàng.'
                : `Mã 6 số đã được gửi về ${registeredEmail}.`}
            </p>
          </div>

          {error && <div className="alert alert-error">❌ {error}</div>}

          {step === 'register' ? (
            <>
              <div className="google-login-wrapper auth-google-top">
                <div className="google-login-container">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    text="signup_with"
                    shape="rectangular"
                    locale="vi"
                    width="320"
                  />
                </div>
              </div>

              <div className="auth-divider">
                <span>hoặc đăng ký bằng email</span>
              </div>

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

                <button
                  type="submit"
                  className="btn btn-primary btn-full auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Đang gửi mã...' : 'Tạo tài khoản'}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyRegisterCode}>
              <div className="form-group">
                <label>Mã xác thực email</label>
                <div className="input-shell">
                  <span className="input-icon">🔐</span>
                  <input
                    type="text"
                    placeholder="Nhập mã 6 số"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    required
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full auth-submit-btn"
                disabled={loading}
              >
                {loading ? 'Đang xác thực...' : 'Xác thực và đăng nhập'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-full"
                onClick={() => setStep('register')}
                disabled={loading}
              >
                Quay lại sửa thông tin
              </button>
            </form>
          )}

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