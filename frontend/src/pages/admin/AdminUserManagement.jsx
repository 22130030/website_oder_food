import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

const INITIAL_USERS = [
  { id: 1, fullName: 'Lê Minh Công', email: 'cong@email.com', phone: '0901234567', role: 'ADMIN', createdAt: '2025-01-01', orderCount: 0, status: 'ACTIVE' },
  { id: 2, fullName: 'Nguyễn Văn A', email: 'a@email.com', phone: '0912345678', role: 'CUSTOMER', createdAt: '2025-02-10', orderCount: 12, status: 'ACTIVE' },
  { id: 3, fullName: 'Trần Thị B', email: 'b@email.com', phone: '0923456789', role: 'CUSTOMER', createdAt: '2025-03-05', orderCount: 7, status: 'ACTIVE' },
  { id: 4, fullName: 'Lê Minh C', email: 'c@email.com', phone: '0934567890', role: 'CUSTOMER', createdAt: '2025-03-20', orderCount: 3, status: 'INACTIVE' },
  { id: 5, fullName: 'Phạm Văn D', email: 'd@email.com', phone: '0945678901', role: 'CUSTOMER', createdAt: '2025-04-01', orderCount: 18, status: 'ACTIVE' },
];

const AdminUserManagement = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const toggleStatus = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u));
  const handleDelete = (id) => { setUsers(prev => prev.filter(u => u.id !== id)); setDeleteConfirm(null); };

  return (
    <AdminLayout title="👥 Quản lý người dùng">
      <div className="admin-toolbar card" style={{ marginBottom: 16 }}>
        <div className="toolbar-left">
          <input placeholder="🔍 Tìm tên, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ width: 140 }}>
            <option value="ALL">Tất cả</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#666' }}>
          <span>Tổng: <strong>{users.length}</strong></span>
          <span style={{ color: 'var(--success)' }}>Hoạt động: <strong>{users.filter(u => u.status === 'ACTIVE').length}</strong></span>
          <span style={{ color: 'var(--danger)' }}>Vô hiệu: <strong>{users.filter(u => u.status === 'INACTIVE').length}</strong></span>
        </div>
      </div>

      <div className="card admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>SĐT</th><th>Vai trò</th><th>Đơn hàng</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td className="text-muted">#{user.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: user.role === 'ADMIN' ? 'var(--primary)' : 'var(--info)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {user.fullName[0]}
                      </div>
                      <strong>{user.fullName}</strong>
                    </div>
                  </td>
                  <td className="text-muted">{user.email}</td>
                  <td className="text-muted">{user.phone}</td>
                  <td>
                    <span className={`badge ${user.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`}>{user.role}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}><strong>{user.orderCount}</strong></td>
                  <td className="text-muted">{user.createdAt}</td>
                  <td>
                    <span className={`badge ${user.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                      {user.status === 'ACTIVE' ? '✅ Hoạt động' : '⛔ Vô hiệu'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      {user.role !== 'ADMIN' && (
                        <>
                          <button className={`btn btn-sm ${user.status === 'ACTIVE' ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleStatus(user.id)}>
                            {user.status === 'ACTIVE' ? '⛔ Khóa' : '✅ Mở'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(user.id)}>🗑️ Xóa</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 0' }}><div className="icon">👥</div><h3>Không tìm thấy người dùng</h3></div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box card confirm-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3>Xóa tài khoản người dùng?</h3>
              <p style={{ color: '#888', margin: '12px 0 24px' }}>Toàn bộ dữ liệu của người dùng này sẽ bị xóa vĩnh viễn!</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>🗑️ Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUserManagement;
