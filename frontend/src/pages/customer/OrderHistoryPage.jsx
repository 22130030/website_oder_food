import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import './OrderHistoryPage.css';

const MOCK_ORDERS = [
  { id: 1001, date: '2025-06-15 14:30', status: 'COMPLETED', total: 165000, items: ['Phở Bò Đặc Biệt x1', 'Trà Sữa x2'] },
  { id: 1002, date: '2025-06-14 09:20', status: 'DELIVERING', total: 75000, items: ['Cơm Tấm Sườn Nướng x1'] },
  { id: 1003, date: '2025-06-12 19:45', status: 'PREPARING', total: 320000, items: ['Lẩu Thái Hải Sản x1', 'Nước Cam x2'] },
  { id: 1004, date: '2025-06-10 12:00', status: 'CANCELLED', total: 90000, items: ['Pizza Hải Sản x1'] },
  { id: 1005, date: '2025-06-08 18:15', status: 'COMPLETED', total: 138000, items: ['Bún Bò Huế x2'] },
];

const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận', badge: 'badge-warning',   icon: '⏳' },
  PREPARING: { label: 'Đang chuẩn bị', badge: 'badge-info',    icon: '👨‍🍳' },
  DELIVERING:{ label: 'Đang giao',     badge: 'badge-secondary',icon: '🚗' },
  COMPLETED: { label: 'Hoàn thành',    badge: 'badge-success',  icon: '✅' },
  CANCELLED: { label: 'Đã hủy',        badge: 'badge-danger',   icon: '❌' },
};

const TABS = ['ALL','PENDING','PREPARING','DELIVERING','COMPLETED','CANCELLED'];

const OrderHistoryPage = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('ALL');
  const [showSuccess, setShowSuccess] = useState(location.state?.success);

  useEffect(() => { if (showSuccess) setTimeout(() => setShowSuccess(false), 3000); }, [showSuccess]);

  const filtered = activeTab === 'ALL' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === activeTab);

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="order-history-page">
        <div className="inner">
          <h1>📦 Lịch sử đơn hàng</h1>
          {showSuccess && <div className="alert alert-success">🎉 Đặt hàng thành công! Chúng tôi đang xử lý đơn hàng của bạn.</div>}
          <div className="order-tabs">
            {TABS.map(tab => (
              <button key={tab} className={`tab-btn ${activeTab===tab?'active':''}`} onClick={() => setActiveTab(tab)}>
                {tab==='ALL' ? '📋 Tất cả' : `${STATUS_MAP[tab]?.icon} ${STATUS_MAP[tab]?.label}`}
                <span className="tab-count">{tab==='ALL'?MOCK_ORDERS.length:MOCK_ORDERS.filter(o=>o.status===tab).length}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📦</div>
              <h3>Chưa có đơn hàng nào</h3>
              <Link to="/menu" className="btn btn-primary mt-2">Đặt hàng ngay</Link>
            </div>
          ) : (
            <div className="orders-list">
              {filtered.map(order => {
                const st = STATUS_MAP[order.status];
                return (
                  <div key={order.id} className="order-card card">
                    <div className="order-card-header">
                      <div><span className="order-id">Đơn hàng #{order.id}</span><span className="order-date">{order.date}</span></div>
                      <span className={`badge ${st.badge}`}>{st.icon} {st.label}</span>
                    </div>
                    <div className="order-items-preview">
                      {order.items.map((item,i) => <span key={i} className="order-item-tag">{item}</span>)}
                    </div>
                    <div className="order-card-footer">
                      <strong className="order-total">{order.total.toLocaleString('vi-VN')}đ</strong>
                      <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderHistoryPage;