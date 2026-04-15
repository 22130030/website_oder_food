import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './AuthPage.css';

const RegisterPage = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    passwordConfirm: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password !== form.passwordConfirm) {
      setError('Mật khẩu không khớp!');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName
      });
      login(res.data.user, res.data.token);
      alert('Đăng ký thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại!');
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
          <h2>Đăng ký</h2>
          <p className="auth-subtitle">Tạo tài khoản để bắt đầu đặt hàng!</p>

          {error && <div className="alert alert-error">❌ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Họ</label>
              <input 
                type="text" 
                name="firstName" 
                placeholder="Nhập họ của bạn" 
                value={form.firstName} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Tên</label>
              <input 
                type="text" 
                name="lastName" 
                placeholder="Nhập tên của bạn" 
                value={form.lastName} 
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
              <label>Mật khẩu</label>
              <input 
                type="password" 
                name="password" 
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)" 
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

          <div className="auth-divider"><span>hoặc</span></div>
          <p className="auth-switch">
            Đã có tài khoản? <Link to="/login" className="link-primary">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
