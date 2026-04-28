import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminUserAPI } from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  avatarUrl: '',
  role: 'CUSTOMER',
  isActive: true,
  newPassword: '',
  confirmPassword: ''
};

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState('Tất cả');

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminUserAPI.getUsers(searchText);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('vi-VN', {
      hour12: false
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole = filterRole === 'Tất cả' || u.role === filterRole;

      const matchStatus =
        filterStatus === 'Tất cả' ||
        (filterStatus === 'ACTIVE' && u.isActive) ||
        (filterStatus === 'INACTIVE' && !u.isActive);

      const keyword = searchText.toLowerCase();
      const matchSearch =
        (u.fullName || '').toLowerCase().includes(keyword) ||
        (u.email || '').toLowerCase().includes(keyword);

      return matchRole && matchStatus && matchSearch;
    });
  }, [users, searchText, filterRole, filterStatus]);

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || '',
      role: user.role || 'CUSTOMER',
      isActive: user.isActive ?? true,
      newPassword: '',
      confirmPassword: ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
  e.preventDefault();

  if (!editUser) return;

  if (form.newPassword && form.newPassword.length < 6) {
    toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    return;
  }

  if (form.newPassword !== form.confirmPassword) {
    toast.error('Xác nhận mật khẩu không khớp');
    return;
  }

  try {
    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      avatarUrl: form.avatarUrl,
      role: form.role,
      isActive: form.isActive,
      newPassword: form.newPassword
    };

    await adminUserAPI.updateUser(editUser.id, payload);
    toast.success('Cập nhật người dùng thành công');
    closeModal();
    loadUsers();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Cập nhật người dùng thất bại');
  }
};

  const handleToggleActive = async (id) => {
    try {
      await adminUserAPI.toggleActive(id);
      toast.success('Đã cập nhật trạng thái tài khoản');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được trạng thái');
    }
  };

  return (
    <AdminLayout title="👥 Quản lý người dùng">
      <div className="admin-toolbar card">
        <div className="toolbar-left">
          <input
            placeholder="🔍 Tìm theo tên hoặc email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ width: 160 }}
          >
            <option>Tất cả</option>
            <option>ADMIN</option>
            <option>CUSTOMER</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 160 }}
          >
            <option>Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã khóa</option>
          </select>
        </div>

        <button className="btn btn-outline" onClick={loadUsers}>
          🔄 Tải lại
        </button>
      </div>

      <div className="food-stats">
        <div className="food-stat-item">
          Tổng user: <strong>{users.length}</strong>
        </div>
        <div className="food-stat-item success">
          Active: <strong>{users.filter((u) => u.isActive).length}</strong>
        </div>
        <div className="food-stat-item danger">
          Inactive: <strong>{users.filter((u) => !u.isActive).length}</strong>
        </div>
        <div className="food-stat-item info">
          Kết quả lọc: <strong>{filteredUsers.length}</strong>
        </div>
      </div>

      <div className="card admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>HỌ TÊN</th>
                <th>EMAIL</th>
                <th>ĐIỆN THOẠI</th>
                <th>ROLE</th>
                <th>NGÀY TẠO</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td><strong>{user.fullName}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.phone || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          user.role === 'ADMIN' ? 'badge-danger' : 'badge-info'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>{formatDateTime(user.createdAt)}</td>
                    <td>
                      <button
                        className={`toggle-btn ${user.isActive ? 'available' : 'unavailable'}`}
                        onClick={() => handleToggleActive(user.id)}
                      >
                        {user.isActive ? '✅ Active' : '❌ Khóa'}
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEdit(user)}
                        >
                          ✏️ Sửa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && filteredUsers.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="icon">👤</div>
              <h3>Không tìm thấy người dùng nào</h3>
            </div>
          )}

          {loading && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <h3>Đang tải dữ liệu...</h3>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Chỉnh sửa người dùng</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSave} className="modal-body">
              <div className="form-group">
                <label>Họ tên</label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleFormChange}
                  placeholder="Để trống nếu không đổi mật khẩu"
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleFormChange}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  name="avatarUrl"
                  value={form.avatarUrl}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label>Vai trò</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                />
                Đang hoạt động
              </label>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  💾 Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUserManagement;