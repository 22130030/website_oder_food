import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

const ORDER_STATUSES = ['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELLED'];
const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', badge: 'badge-warning', icon: '⏳' },
  PREPARING: { label: 'Đang chuẩn bị', badge: 'badge-info', icon: '👨‍🍳' },
  DELIVERING: { label: 'Đang giao', badge: 'badge-secondary', icon: '🚗' },
  COMPLETED: { label: 'Hoàn thành', badge: 'badge-success', icon: '✅' },
  CANCELLED: { label: 'Đã hủy', badge: 'badge-danger', icon: '❌' },
};
const NEXT_STATUS = { PENDING: 'PREPARING', PREPARING: 'DELIVERING', DELIVERING: 'COMPLETED' };

const INITIAL_ORDERS = [
  { id: 1008, customer: 'Nguyễn Văn A', phone: '0901234567', address: '123 Nguyễn Trãi, Q.1', items: ['Phở Bò x2'], total: 150000, status: 'PENDING', date: '2025-06-15 14:30', payment: 'COD' },
  { id: 1007, customer: 'Trần Thị B', phone: '0912345678', address: '456 Lê Lợi, Q.3', items: ['Cơm Tấm x1', 'Trà Sữa x2'], total: 135000, status: 'PREPARING', date: '2025-06-15 14:18', payment: 'VNPAY' },
  { id: 1006, customer: 'Lê Minh C', phone: '0923456789', address: '789 Đinh Tiên Hoàng, Q.BT', items: ['Lẩu Thái x1'], total: 280000, status: 'DELIVERING', date: '2025-06-15 14:05', payment: 'COD' },
  { id: 1005, customer: 'Phạm Văn D', phone: '0934567890', address: '321 CMT8, Q.10', items: ['Pizza x1', 'Nước Cam x2'], total: 235000, status: 'COMPLETED', date: '2025-06-15 13:30', payment: 'COD' },
  { id: 1004, customer: 'Hoàng Thị E', phone: '0945678901', address: '654 Võ Thị Sáu, Q.3', items: ['Bún Bò x2'], total: 140000, status: 'CANCELLED', date: '2025-06-15 13:00', payment: 'COD' },
];

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);

  const filtered = orders.filter(o => {
    const matchTab = activeTab === 'ALL' || o.status === activeTab;
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search);
    return matchTab && matchSearch;
  });

  const updateStatus = (id, status) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (detailOrder?.id === id) setDetailOrder(prev => ({ ...prev, status }));
  };

  return (
    <AdminLayout title="📦 Quản lý đơn hàng">
      {/* Tabs */}
      <div className="admin-toolbar card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          {['ALL', ...ORDER_STATUSES].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '7px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeTab === tab ? 'var(--primary)' : '#f0f0f0', color: activeTab === tab ? 'white' : '#555', transition: 'all 0.2s' }}
            >
              {tab === 'ALL' ? 'Tất cả' : `${STATUS_MAP[tab]?.icon} ${STATUS_MAP[tab]?.label}`}
              <span style={{ marginLeft: 6, background: 'rgba(0,0,0,0.1)', borderRadius: '10px', padding: '1px 7px', fontSize: 11 }}>
                {tab === 'ALL' ? orders.length : orders.filter(o => o.status === tab).length}
              </span>
            </button>
          ))}
        </div>
        <input placeholder="🔍 Tìm theo tên / mã đơn" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
      </div>

      <div style={{ display: detailOrder ? 'grid' : 'block', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        {/* Orders Table */}
        <div className="card admin-table-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Khách hàng</th><th>Tổng tiền</th><th>TT Thanh toán</th><th>Trạng thái</th><th>Ngày đặt</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {filtered.map(order => {
                  const st = STATUS_MAP[order.status];
                  const next = NEXT_STATUS[order.status];
                  return (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>
                        <strong>{order.customer}</strong>
                        <div style={{ fontSize: 12, color: '#999' }}>{order.phone}</div>
                      </td>
                      <td><strong>{order.total.toLocaleString('vi-VN')}đ</strong></td>
                      <td><span className="badge badge-warning">{order.payment}</span></td>
                      <td><span className={`badge ${st.badge}`}>{st.icon} {st.label}</span></td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{order.date}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-outline btn-sm" onClick={() => setDetailOrder(order)}>👁️ Chi tiết</button>
                          {next && (
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(order.id, next)}>
                              → {STATUS_MAP[next].label}
                            </button>
                          )}
                          {order.status === 'PENDING' && (
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(order.id, 'CANCELLED')}>❌ Hủy</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="icon">📦</div><h3>Không có đơn hàng nào</h3>
              </div>
            )}
          </div>
        </div>

        {/* Order Detail Panel */}
        {detailOrder && (
          <div className="card" style={{ padding: 24, alignSelf: 'start', position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Chi tiết #{detailOrder.id}</h3>
              <button onClick={() => setDetailOrder(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div><strong>Khách hàng:</strong> {detailOrder.customer}</div>
              <div><strong>SĐT:</strong> {detailOrder.phone}</div>
              <div><strong>Địa chỉ:</strong> {detailOrder.address}</div>
              <div><strong>Thanh toán:</strong> {detailOrder.payment}</div>
              <div><strong>Trạng thái:</strong> <span className={`badge ${STATUS_MAP[detailOrder.status]?.badge}`}>{STATUS_MAP[detailOrder.status]?.icon} {STATUS_MAP[detailOrder.status]?.label}</span></div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <strong>Món đặt:</strong>
                {detailOrder.items.map((item, i) => <div key={i} style={{ color: '#555', marginTop: 6 }}>• {item}</div>)}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, fontSize: 16 }}>
                <strong>Tổng:</strong> <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{detailOrder.total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NEXT_STATUS[detailOrder.status] && (
                <button className="btn btn-primary btn-full" onClick={() => updateStatus(detailOrder.id, NEXT_STATUS[detailOrder.status])}>
                  ➡️ Chuyển: {STATUS_MAP[NEXT_STATUS[detailOrder.status]]?.label}
                </button>
              )}
              {detailOrder.status === 'PENDING' && (
                <button className="btn btn-danger btn-full" onClick={() => { updateStatus(detailOrder.id, 'CANCELLED'); }}>❌ Hủy đơn</button>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrderManagement;
