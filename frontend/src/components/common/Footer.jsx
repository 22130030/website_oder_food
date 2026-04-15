import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-grid">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">🍔 <span>NLU-FoodStack</span></div>
          <p>Hệ thống đặt đồ ăn trực tuyến tiện lợi, nhanh chóng và an toàn. Giao hàng trong 30 phút!</p>
          <div className="social-links">
            <a href="#" className="social-btn">📘</a>
            <a href="#" className="social-btn">📸</a>
            <a href="#" className="social-btn">🐦</a>
            <a href="#" className="social-btn">▶️</a>
          </div>
        </div>

        {/* Links */}
        <div className="footer-col">
          <h4>Khám phá</h4>
          <Link to="/">Trang chủ</Link>
          <Link to="/menu">Thực đơn</Link>
          <Link to="/orders">Đơn hàng</Link>
          <Link to="/chat">Hỗ trợ</Link>
        </div>

        <div className="footer-col">
          <h4>Tài khoản</h4>
          <Link to="/login">Đăng nhập</Link>
          <Link to="/register">Đăng ký</Link>
          <Link to="/profile">Hồ sơ cá nhân</Link>
        </div>

        {/* Contact */}
        <div className="footer-col">
          <h4>Liên hệ</h4>
          <div className="contact-item">
            <span>📍</span>
            <span>Trường ĐH Nông Lâm TP.HCM</span>
          </div>
          <div className="contact-item">
            <span>📞</span>
            <span>1900-xxxx</span>
          </div>
          <div className="contact-item">
            <span>✉️</span>
            <span>support@nlufoodstack.vn</span>
          </div>
          <div className="contact-item">
            <span>⏰</span>
            <span>7:00 - 22:00 mỗi ngày</span>
          </div>
        </div>

      </div>

      <div className="footer-divider" />

      <div className="footer-bottom">
        <p>© 2025 NLU-FoodStack. Made with ❤️ by <strong>Lê Minh Công</strong> - MSSV: 22130030 - DH22DTC</p>
        <div className="footer-badges">
          <span>🔒 Bảo mật SSL</span>
          <span>✅ Thanh toán an toàn</span>
          <span>🚀 Giao hàng nhanh</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;