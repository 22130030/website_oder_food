import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const close = () => setMenuOpen(false);
  const isActive = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  // Ẩn giỏ hàng nếu là Admin
  const showCart = !isAuthenticated || user?.role === 'CUSTOMER';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          🍔 <span>NLU-FoodStack</span>
        </Link>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/home"       className={isActive('/home')}       onClick={close}>Trang chủ</Link>
          <Link to="/menu"   className={isActive('/menu')}   onClick={close}>Thực đơn</Link>
          <Link to="/orders" className={isActive('/orders')} onClick={close}>Đơn hàng</Link>
          <Link to="/chat"   className={isActive('/chat')}   onClick={close}>Hỗ trợ</Link>
        </div>

        <div className="navbar-actions">
          {/* Giỏ hàng — luôn hiện trừ Admin */}
          {showCart && (
            <Link to="/cart" className="cart-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          )}

          {isAuthenticated ? (
            <div className="user-dropdown" onMouseLeave={() => setDropdownOpen(false)}>
              <button className="user-btn" onClick={() => setDropdownOpen(o => !o)}>
                <div className="user-avatar-mini">
                  {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <span>{user?.fullName?.split(' ').pop() || user?.email}</span>
                <span className="dropdown-arrow">{dropdownOpen ? '▲' : '▾'}</span>
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {user?.role === 'ADMIN' ? (
                    <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>⚙️ Quản trị</Link>
                  ) : (
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>👤 Hồ sơ</Link>
                  )}
                  <button className="dropdown-item danger" onClick={handleLogout}>🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login"    className="btn btn-outline">Đăng nhập</Link>
              <Link to="/register" className="btn btn-primary">Đăng ký</Link>
            </div>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;