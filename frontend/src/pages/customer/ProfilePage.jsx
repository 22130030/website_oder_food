import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../context/AuthContext';
import { profileAPI } from '../../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, login, logout } = useAuth();

  const userId = user?.userId || user?.id;

  const [activeTab, setActiveTab] = useState('profile');

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || user?.avatar || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatarUrl || user?.avatar || ''
  );

  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const getAvatarSrc = (avatarUrl) => {
    if (!avatarUrl) return '';
    if (avatarUrl.startsWith('blob:')) return avatarUrl;
    if (avatarUrl.startsWith('http')) return avatarUrl;
    return `http://localhost:8080${avatarUrl}`;
  };

  const getAvatarText = () => {
    return (profileForm.fullName || profileForm.email || 'U')
      .charAt(0)
      .toUpperCase();
  };

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const res = await profileAPI.getProfile(userId);
      const data = res.data;

      setProfileForm({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        avatarUrl: data.avatarUrl || '',
      });

      setAvatarPreview(data.avatarUrl || '');
      setSelectedAvatarFile(null);
    } catch (err) {
      console.error('Lỗi load profile:', err);
      showMsg('error', 'Không tải được thông tin cá nhân!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfileForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMsg('error', 'Vui lòng chọn file ảnh!');
      e.target.value = '';
      return;
    }

    setSelectedAvatarFile(file);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const uploadAvatarIfNeeded = async () => {
    if (!selectedAvatarFile) {
      return profileForm.avatarUrl || '';
    }

    const formData = new FormData();
    formData.append('file', selectedAvatarFile);

    const res = await profileAPI.uploadAvatar(formData);

    return (
      res.data.avatarUrl ||
      res.data.avatar ||
      res.data.imageUrl ||
      ''
    );
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      showMsg('error', 'Không lấy được userId. Hãy đăng nhập lại!');
      return;
    }

    if (!profileForm.fullName.trim()) {
      showMsg('error', 'Vui lòng nhập họ và tên!');
      return;
    }

    try {
      setLoading(true);

      const avatarUrl = await uploadAvatarIfNeeded();

      const res = await profileAPI.updateProfile(userId, {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        avatarUrl,
      });

      const updated = res.data;
      const token = localStorage.getItem('token');

      const newUserData = {
        ...user,
        id: updated.id,
        userId: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
        role: updated.role,
      };

      login(newUserData, token);

      setProfileForm({
        fullName: updated.fullName || '',
        email: updated.email || '',
        phone: updated.phone || '',
        avatarUrl: updated.avatarUrl || '',
      });

      setAvatarPreview(updated.avatarUrl || '');
      setSelectedAvatarFile(null);

      showMsg('success', 'Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error('Lỗi cập nhật profile:', err);
      showMsg(
        'error',
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Cập nhật thất bại!'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      showMsg('error', 'Không lấy được userId. Hãy đăng nhập lại!');
      return;
    }

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showMsg('error', 'Mật khẩu xác nhận không khớp!');
      return;
    }

    if (pwForm.newPassword.length < 6) {
      showMsg('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    try {
      setLoading(true);

      await profileAPI.changePassword(userId, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });

      showMsg('success', 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');

      setPwForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        if (logout) {
          logout();
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }

        window.location.href = '/login';
      }, 1200);
    } catch (err) {
      console.error('Lỗi đổi mật khẩu:', err);

      showMsg(
        'error',
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Mật khẩu hiện tại không đúng!'
      );
    } finally {
      setLoading(false);
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
                  {avatarPreview ? (
                    <img
                      src={getAvatarSrc(avatarPreview)}
                      alt="Avatar"
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <span>{getAvatarText()}</span>
                  )}
                </div>

                <h3>{profileForm.fullName || 'Người dùng'}</h3>
                <p>{profileForm.email}</p>

                <span className="badge badge-success">Khách hàng</span>

                <label
                  htmlFor="avatar-upload"
                  className="btn btn-secondary btn-sm mt-2"
                  style={{
                    marginTop: 12,
                    display: 'inline-flex',
                    cursor: 'pointer',
                  }}
                >
                  📷 Chọn ảnh từ máy tính
                </label>

                <input
                  type="file"
                  id="avatar-upload"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                  accept="image/*"
                />

                {selectedAvatarFile && (
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: '#666',
                    }}
                  >
                    Đã chọn: {selectedAvatarFile.name}
                  </p>
                )}
              </div>

              <nav className="profile-nav">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`profile-nav-btn ${activeTab === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="profile-content card">
              {msg.text && (
                <div
                  className={`alert alert-${
                    msg.type === 'success' ? 'success' : 'error'
                  }`}
                >
                  {msg.text}
                </div>
              )}

              {activeTab === 'profile' && (
                <>
                  <h2>👤 Thông tin cá nhân</h2>

                  <form onSubmit={handleProfileSubmit}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label>Họ và tên</label>
                        <input
                          name="fullName"
                          value={profileForm.fullName}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          name="email"
                          value={profileForm.email}
                          disabled
                          style={{
                            background: '#f5f5f5',
                            color: '#999',
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                          name="phone"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
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
                      <input
                        type="password"
                        value={pwForm.currentPassword}
                        onChange={(e) =>
                          setPwForm({
                            ...pwForm,
                            currentPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Mật khẩu mới</label>
                      <input
                        type="password"
                        value={pwForm.newPassword}
                        onChange={(e) =>
                          setPwForm({
                            ...pwForm,
                            newPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={pwForm.confirmPassword}
                        onChange={(e) =>
                          setPwForm({
                            ...pwForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
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