import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminUserAPI } from '../../services/api';
import { toast } from 'react-toastify';

const EMPTY_FORM = {
  fullName: '',
  email: '',
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

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const openCreate = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
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

    const isCreate = !editUser;

    if (!form.fullName.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }

    if (isCreate) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (!emailRegex.test(form.email.trim())) {
        toast.error('Email không hợp lệ');
        return;
      }

      if (!form.newPassword || form.newPassword.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự');
        return;
      }
    }

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
        email: form.email,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
        role: form.role,
        isActive: form.isActive,
        newPassword: form.newPassword
      };

      if (isCreate) {
        await adminUserAPI.createUser(payload);
        toast.success('Thêm tài khoản thành công');
      } else {
        await adminUserAPI.updateUser(editUser.id, payload);
        toast.success('Cập nhật người dùng thành công');
      }

      closeModal();
      loadUsers();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (isCreate ? 'Thêm tài khoản thất bại' : 'Cập nhật người dùng thất bại')
      );
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

  const openDeleteConfirm = (user) => {
    setDeleteTarget(user);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      await adminUserAPI.deleteUser(deleteTarget.id);
      toast.success('Xóa tài khoản thành công');
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa tài khoản thất bại');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Quản lý người dùng">
      <style>{`
        .action-btns {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .user-delete-btn {
          color: #dc2626 !important;
          border-color: #fecaca !important;
          background: #fff5f5 !important;
        }

        .user-delete-btn:hover {
          color: #ffffff !important;
          background: #ef4444 !important;
          border-color: #ef4444 !important;
        }

        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.56);
          backdrop-filter: blur(7px);
          animation: deleteFadeIn 0.18s ease;
        }

        .delete-modal {
          width: 100%;
          max-width: 460px;
          padding: 30px;
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 32px 90px rgba(15, 23, 42, 0.32);
          text-align: center;
          animation: deletePopIn 0.22s ease;
        }

        .delete-modal-icon {
          width: 72px;
          height: 72px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          color: #ffffff;
          background: linear-gradient(135deg, #ef4444, #fb923c);
          font-size: 36px;
          font-weight: 950;
          box-shadow: 0 16px 34px rgba(239, 68, 68, 0.3);
        }

        .delete-modal h3 {
          margin: 0 0 10px;
          color: #111827;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -0.4px;
        }

        .delete-modal-desc {
          margin: 0;
          color: #4b5563;
          font-size: 15px;
          line-height: 1.65;
        }

        .delete-modal-desc strong {
          color: #ef4444;
          font-weight: 950;
        }

        .delete-user-info {
          margin: 18px 0 12px;
          padding: 15px 16px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          text-align: left;
        }

        .delete-user-info-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 6px 0;
          color: #111827;
          font-size: 14px;
        }

        .delete-user-info-row span {
          flex: 0 0 auto;
          color: #8a94a6;
          font-weight: 850;
        }

        .delete-user-info-row b {
          text-align: right;
          font-weight: 850;
          word-break: break-word;
        }

        .delete-warning {
          margin-bottom: 22px;
          padding: 13px 14px;
          border-radius: 16px;
          color: #b45309;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          font-size: 13px;
          line-height: 1.55;
          text-align: left;
        }

        .delete-modal-actions {
          display: flex;
          gap: 12px;
        }

        .delete-cancel-btn,
        .delete-confirm-btn {
          flex: 1;
          height: 47px;
          border: none;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .delete-cancel-btn {
          color: #475569;
          background: #f1f5f9;
        }

        .delete-cancel-btn:hover {
          background: #e2e8f0;
        }

        .delete-confirm-btn {
          color: #ffffff;
          background: linear-gradient(135deg, #ef4444, #f97316);
          box-shadow: 0 13px 26px rgba(239, 68, 68, 0.24);
        }

        .delete-confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 17px 34px rgba(239, 68, 68, 0.34);
        }

        .delete-confirm-btn:disabled,
        .delete-cancel-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @keyframes deleteFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes deletePopIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 520px) {
          .delete-modal {
            padding: 24px 20px;
          }

          .delete-modal-actions {
            flex-direction: column;
          }
        }
      `}</style>

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

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={openCreate}>
            + Thêm tài khoản
          </button>

          <button className="btn btn-outline" onClick={loadUsers}>
            Tải lại
          </button>
        </div>
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
                    <td>
                      <strong>{user.fullName}</strong>
                    </td>
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
                        {user.isActive ? 'Active' : 'Khóa'}
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEdit(user)}
                        >
                          Sửa
                        </button>

                        <button
                          className="btn btn-outline btn-sm user-delete-btn"
                          onClick={() => openDeleteConfirm(user)}
                        >
                          Xóa
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
              <h3>{editUser ? 'Chỉnh sửa người dùng' : 'Thêm tài khoản mới'}</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
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
                <label>Email</label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  disabled={!!editUser}
                  required
                  placeholder="Nhập email đăng nhập"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <input name="phone" value={form.phone} onChange={handleFormChange} />
              </div>

              <div className="form-group">
                <label>{editUser ? 'Mật khẩu mới' : 'Mật khẩu'}</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleFormChange}
                  placeholder={editUser ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu'}
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
                <input name="avatarUrl" value={form.avatarUrl} onChange={handleFormChange} />
              </div>

              <div className="form-group">
                <label>Vai trò</label>
                <select name="role" value={form.role} onChange={handleFormChange}>
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
                  {editUser ? 'Lưu thay đổi' : 'Thêm tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={closeDeleteConfirm}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">!</div>

            <h3>Xác nhận xóa tài khoản</h3>

            <p className="delete-modal-desc">
              Bạn có chắc muốn xóa tài khoản{' '}
              <strong>{deleteTarget.fullName || deleteTarget.email}</strong> không?
            </p>

            <div className="delete-user-info">
              <div className="delete-user-info-row">
                <span>Email</span>
                <b>{deleteTarget.email || '-'}</b>
              </div>
              <div className="delete-user-info-row">
                <span>Vai trò</span>
                <b>{deleteTarget.role || '-'}</b>
              </div>
              <div className="delete-user-info-row">
                <span>Trạng thái</span>
                <b>{deleteTarget.isActive ? 'Đang hoạt động' : 'Đã khóa'}</b>
              </div>
            </div>

            <div className="delete-warning">
              Lưu ý: nếu tài khoản đã có đơn hàng, đánh giá hoặc dữ liệu liên quan,
              hệ thống có thể không cho xóa. Khi đó bạn nên dùng chức năng khóa tài khoản.
            </div>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={closeDeleteConfirm}
                disabled={deleting}
              >
                Hủy
              </button>

              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUserManagement;
