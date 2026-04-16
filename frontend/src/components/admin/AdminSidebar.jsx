import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const MENU_ITEMS = [
  { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { path: '/admin/foods', icon: '🍔', label: 'Quản lý món ăn' },
  { path: '/admin/orders', icon: '📦', label: 'Quản lý đơn hàng' },
  { path: '/admin/users', icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/chat', icon: '💬', label: 'Quản lý chat' },
  { path: '/admin/statistics', icon: '📈', label: 'Thống kê & Báo cáo' },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path, exact) => exact ? location.pathname === path : location.pathname.startsWith(path) && location.pathname !== '/admin' || location.pathname === path;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="brand-icon">🍔</span>
        <div>
          <h2>NLU-FoodStack</h2>
          <span>Admin Panel</span>
        </div>
      </div>

      <div className="admin-profile">
        <div className="admin-avatar">{(user?.fullName || 'A')[0]}</div>
        <div>
          <strong>{user?.fullName || 'Admin'}</strong>
          <p>Quản trị viên</p>
        </div>
      </div>

      <nav className="admin-nav">
        {MENU_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`admin-nav-item ${(item.exact ? location.pathname === item.path : location.pathname === item.path || location.pathname.startsWith(item.path + '/')) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link to="/" className="sidebar-footer-btn">🌐 Xem website</Link>
        <button className="sidebar-footer-btn danger" onClick={handleLogout}>🚪 Đăng xuất</button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
