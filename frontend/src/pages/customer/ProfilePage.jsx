import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '' });
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });  // Khai báo pwForm
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.updateProfile(profileForm);
      updateUser(res.data);
      showMsg('success', 'Cập nhật hồ sơ thành công!');
    } catch {
      showMsg('error', 'Cập nhật thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMsg('error', 'Mật khẩu xác nhận không khớp!');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      showMsg('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(pwForm);
      showMsg('success', 'Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      showMsg('error', 'Mật khẩu hiện tại không đúng!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm thay đổi avatar
  const handleAvatarChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setLoading(true);
      const res = await api.uploadAvatar(formData);
      setAvatar(res.data.avatar); // Cập nhật avatar mới
      updateUser({ ...user, avatar: res.data.avatar }); // Cập nhật user context
      showMsg('success', 'Cập nhật ảnh đại diện thành công!');
    } catch {
      showMsg('error', 'Cập nhật ảnh đại diện thất bại!');
    } finally {
      setLoading(false);
    }
  }
};

  const TABS = [
    { id: 'profile', icon: '👤', label: 'Thông tin cá nhân' },
    { id: 'password', icon: '🔐', label: 'Đổi mật khẩu' },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="profile-page">
        <div className="inner">
          <div className="profile-layout">
            <div className="profile-sidebar card">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <img src={avatar || 'https://via.placeholder.com/76'} alt="Avatar" style={{ width: '76px', height: '76px', borderRadius: '50%' }} />
                </div>
                <h3>{user?.fullName || 'Người dùng'}</h3>
                <p>{user?.email}</p>
                <span className="badge badge-success">Khách hàng</span>
                <label htmlFor="avatar-upload" className="btn btn-secondary btn-sm mt-2">
                  Thay đổi ảnh đại diện
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                  accept="image/*"
                />
              </div>
              <nav className="profile-nav">
                {TABS.map((t) => (
                  <button key={t.id} className={`profile-nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="profile-content card">
              {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

              {activeTab === 'profile' && (
                <>
                  <h2>👤 Thông tin cá nhân</h2>
                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Họ và tên</label>
                        <input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input value={profileForm.email} disabled style={{ background: '#f5f5f5', color: '#999' }} />
                      </div>
                      <div className="form-group">
                        <label>Số điện thoại</label>
                        <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Địa chỉ mặc định</label>
                        <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Địa chỉ giao hàng" />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                    </button>
                  </form>
                </>
              )}

              {activeTab === 'password' && (
                <>
                  <h2>🔐 Đổi mật khẩu</h2>
                  <form onSubmit={handlePwSubmit} style={{ maxWidth: 400 }}>
                    <div className="form-group">
                      <label>Mật khẩu hiện tại</label>
                      <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu mới</label>
                      <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới</label>
                      <input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? '⏳ Đang đổi...' : '🔑 Đổi mật khẩu'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;