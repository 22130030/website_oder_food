import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import './AdminSidebar.css';

const MENU_ITEMS = [
  { path: '/admin', icon: '📊', label: 'Dashboard', exact: true },
  { path: '/admin/foods', icon: '🍽️', label: 'Quản lý món ăn' },
  { path: '/admin/orders', icon: '📦', label: 'Quản lý đơn hàng' },
  { path: '/admin/users', icon: '👥', label: 'Quản lý người dùng' },
  { path: '/admin/chat', icon: '💬', label: 'Quản lý chat' },
  { path: '/admin/statistics', icon: '📈', label: 'Thống kê & Báo cáo' },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [adminChatUnread, setAdminChatUnread] = useState(0);

  const isActive = (path, exact) =>
    exact
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.fullName || 'A')[0].toUpperCase();

  const loadAdminUnreadCount = () => {
    chatAPI.getAdminUnreadCount()
      .then(res => setAdminChatUnread(Number(res.data || 0)))
      .catch(err => console.error('Lỗi lấy unread admin:', err));
  };

  useEffect(() => {
    loadAdminUnreadCount();

    const handleAdminChatRead = () => {
      setAdminChatUnread(0);
      loadAdminUnreadCount();
  };

  window.addEventListener('admin-chat-read', handleAdminChatRead);

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-chat'),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log(' ADMIN SIDEBAR connected WebSocket');

        client.subscribe('/topic/admin/conversations', () => {
          loadAdminUnreadCount();
        });
      },

      onStompError: (frame) => {
        console.error(' ADMIN SIDEBAR STOMP error:', frame);
      },

      onWebSocketError: (error) => {
        console.error(' ADMIN SIDEBAR WebSocket error:', error);
      },
    });

    client.activate();

    return () => {
      client.deactivate();
      window.removeEventListener('admin-chat-read', handleAdminChatRead);
    };
  }, []);

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
        <div className="admin-avatar">{initials}</div>
        <div className="admin-profile-info">
          <strong>{user?.fullName || 'Admin'}</strong>
          <p>Quản trị viên</p>
        </div>
        <span className="admin-online-dot" />
      </div>

      <nav className="admin-nav">
        {MENU_ITEMS.map(item => {
          const isChatMenu = item.path === '/admin/chat';

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>

              <span className="nav-label">
                {item.label}
                {isChatMenu && adminChatUnread > 0 && (
                  <span className="admin-chat-red-dot"></span>
                )}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar-footer">
        <button className="sidebar-footer-btn danger" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;