import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AuthPage.css';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      // Simulate API call
      console.log('Reset password for:', email);
      setMessage('Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn!');
    } catch (err) {
      setError('Không tìm thấy tài khoản với email này!');
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
          <h2>Quên mật khẩu?</h2>
          <p className="auth-subtitle">Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.</p>

          {error && <div className="alert alert-error">❌ {error}</div>}
          {message && <div className="alert alert-success">✅ {message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="example@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Đang xử lý...' : '📧 Gửi hướng dẫn'}
            </button>
          </form>

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
