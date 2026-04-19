import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import './AdminDashboard.css';

const STATS = [
  { icon: '💰', label: 'Doanh thu hôm nay', value: '2,450,000đ', change: '+12%', color: '#27ae60' },
  { icon: '📦', label: 'Đơn hàng hôm nay', value: '38', change: '+5', color: '#3498db' },
  { icon: '👥', label: 'Khách hàng mới', value: '7', change: '+3', color: '#9b59b6' },
  { icon: '🍔', label: 'Món ăn đang bán', value: '124', change: '+2', color: '#e67e22' },
];

const RECENT_ORDERS = [
  { id: 1008, customer: 'Nguyễn Văn A', items: 'Phở Bò x2', total: 150000, status: 'PENDING', time: '5 phút trước' },
  { id: 1007, customer: 'Trần Thị B', items: 'Cơm Tấm x1, Trà Sữa x2', total: 135000, status: 'PREPARING', time: '12 phút trước' },
  { id: 1006, customer: 'Lê Minh C', items: 'Lẩu Thái x1', total: 280000, status: 'DELIVERING', time: '25 phút trước' },
  { id: 1005, customer: 'Phạm Văn D', items: 'Pizza x1, Nước Cam x2', total: 235000, status: 'COMPLETED', time: '1 giờ trước' },
];

const TOP_FOODS = [
  { rank: 1, name: 'Phở Bò Đặc Biệt', sold: 248, revenue: '18,600,000đ' },
  { rank: 2, name: 'Cơm Tấm Sườn Nướng', sold: 196, revenue: '12,740,000đ' },
  { rank: 3, name: 'Trà Sữa Trân Châu', sold: 312, revenue: '10,920,000đ' },
  { rank: 4, name: 'Bún Bò Huế', sold: 154, revenue: '10,780,000đ' },
  { rank: 5, name: 'Bánh Mì Thịt Nướng', sold: 389, revenue: '9,725,000đ' },
];

const STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', badge: 'badge-warning' },
  PREPARING: { label: 'Đang chuẩn bị', badge: 'badge-info' },
  DELIVERING: { label: 'Đang giao', badge: 'badge-secondary' },
  COMPLETED: { label: 'Hoàn thành', badge: 'badge-success' },
};

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AdminLayout title="📊 Dashboard">
      <div className="dashboard-time">
        {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {STATS.map((stat, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-icon" style={{ background: stat.color + '20', color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
              <span className="stat-change positive">{stat.change} so với hôm qua</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="dashboard-section card">
          <div className="section-header-admin">
            <h3>📋 Đơn hàng mới nhất</h3>
            <a href="/admin/orders" className="see-all-admin">Xem tất cả →</a>
          </div>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Món</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map(order => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{order.customer}</td>
                    <td className="text-muted">{order.items}</td>
                    <td><strong>{order.total.toLocaleString('vi-VN')}đ</strong></td>
                    <td><span className={`badge ${STATUS_MAP[order.status]?.badge}`}>{STATUS_MAP[order.status]?.label}</span></td>
                    <td className="text-muted">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Foods */}
        <div className="dashboard-section card">
          <div className="section-header-admin">
            <h3>🔥 Món bán chạy nhất</h3>
          </div>
          {TOP_FOODS.map(food => (
            <div key={food.rank} className="top-food-row">
              <span className={`rank-badge rank-${food.rank}`}>{food.rank}</span>
              <div className="top-food-info">
                <strong>{food.name}</strong>
                <span>Đã bán: {food.sold} suất</span>
              </div>
              <span className="top-food-revenue">{food.revenue}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
