import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../../services/api';
import './AuthPage.css';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (name, value) => {
    if (name === 'code') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = () => {
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Vui lòng nhập email.');
      return null;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setError('Email không đúng định dạng. Ví dụ: example@email.com');
      return null;
    }

    return normalizedEmail;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = validateEmail();
    if (!normalizedEmail) return;

    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(normalizedEmail);

      setForm((prev) => ({
        ...prev,
        email: normalizedEmail
      }));

      setMessage(response.data?.message || 'Mã xác thực đã được gửi về email của bạn.');
      setStep(2);
      toast.success('Đã gửi mã xác thực về email!');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Không thể gửi mã xác thực. Vui lòng kiểm tra email.';

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(form.code)) {
      setError('Mã xác thực phải gồm 6 chữ số.');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyResetCode({
        email: form.email,
        code: form.code
      });

      setMessage(response.data?.message || 'Mã xác thực hợp lệ. Vui lòng nhập mật khẩu mới.');
      setStep(3);
      toast.success('Mã xác thực hợp lệ!');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Mã xác thực không đúng hoặc đã hết hạn.';

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (form.newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword({
        email: form.email,
        code: form.code,
        newPassword: form.newPassword
      });

      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Không thể đặt lại mật khẩu. Vui lòng thử lại.';

      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStepInfo = () => {
    if (step === 1) {
      return {
        badge: 'Khôi phục tài khoản',
        title: 'Quên mật khẩu?',
        subtitle: 'Nhập email tài khoản để nhận mã xác thực đặt lại mật khẩu.'
      };
    }

    if (step === 2) {
      return {
        badge: 'Xác thực email',
        title: 'Nhập mã xác thực',
        subtitle: 'Nhập mã 6 chữ số đã được gửi về email của bạn.'
      };
    }

    return {
      badge: 'Tạo mật khẩu mới',
      title: 'Đặt lại mật khẩu',
      subtitle: 'Nhập mật khẩu mới để hoàn tất khôi phục tài khoản.'
    };
  };

  const stepInfo = getStepInfo();

  return (
    <div className="auth-page auth-forgot-page">
      <div className="auth-left">
        <div className="auth-left-decor auth-left-decor-one" />
        <div className="auth-left-decor auth-left-decor-two" />

        <div className="auth-hero">
          <span className="auth-brand-badge">🍔 NLU-FoodStack</span>
          <span className="auth-kicker">Lấy lại tài khoản nhanh chóng</span>
          <h1>Đừng lo, món ngon vẫn đang chờ bạn</h1>
          <p>
            Chỉ cần xác thực email, bạn có thể đặt lại mật khẩu và tiếp tục theo dõi đơn hàng, ưu đãi của mình.
          </p>

          <div className="auth-highlight-grid">
            <div className="auth-highlight-card">
              <strong>1</strong>
              <span>Nhập email</span>
            </div>
            <div className="auth-highlight-card">
              <strong>2</strong>
              <span>Xác nhận mã</span>
            </div>
            <div className="auth-highlight-card">
              <strong>3</strong>
              <span>Tạo mật khẩu mới</span>
            </div>
          </div>

          <div className="auth-features">
            <div className="feature-item">✅ Quy trình xác thực rõ ràng, dễ thao tác</div>
            <div className="feature-item">📧 Mã xác thực được gửi trực tiếp về email</div>
            <div className="feature-item">🔒 Mật khẩu mới được cập nhật an toàn</div>
            <div className="feature-item">💬 Hỗ trợ 24/7 khi bạn cần</div>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-panel-top">
            <span className="auth-form-badge">{stepInfo.badge}</span>
            <h2>{stepInfo.title}</h2>
            <p className="auth-subtitle">{stepInfo.subtitle}</p>
          </div>

          {error && <div className="alert alert-error">❌ {error}</div>}
          {message && <div className="alert alert-success">✅ {message}</div>}

          {step === 1 && (
            <form onSubmit={handleSendCode}>
              <div className="form-group">
                <label>Email</label>
                <div className="input-shell">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
                {loading ? '⏳ Đang gửi...' : '📧 Gửi mã xác thực'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div className="form-group">
                <label>Mã xác thực</label>
                <div className="input-shell">
                  <span className="input-icon">🔐</span>
                  <input
                    type="text"
                    placeholder="Nhập mã 6 số"
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
                {loading ? '⏳ Đang kiểm tra...' : '✅ Xác nhận mã'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-full mt-2"
                disabled={loading}
                onClick={handleSendCode}
              >
                📧 Gửi lại mã
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <div className="input-shell">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={form.newPassword}
                    onChange={(e) => setField('newPassword', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <div className="input-shell">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={form.confirmPassword}
                    onChange={(e) => setField('confirmPassword', e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={loading}>
                {loading ? '⏳ Đang đổi mật khẩu...' : '🔑 Đổi mật khẩu'}
              </button>
            </form>
          )}

          <div className="auth-divider"><span>hoặc</span></div>
          <p className="auth-switch">
            Quay lại <Link to="/login" className="link-primary">đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;