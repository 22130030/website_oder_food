import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminDashboardAPI } from '../../services/api';
import './AdminDashboard.css';

const STATUS_MAP = {
  PENDING: {
    label: 'Chờ xác nhận',
    badge: 'badge-warning',
  },
  PREPARING: {
    label: 'Đang chuẩn bị',
    badge: 'badge-info',
  },
  DELIVERING: {
    label: 'Đang giao',
    badge: 'badge-secondary',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badge: 'badge-success',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'badge-danger',
  },
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('vi-VN');
};

const formatChangeMoney = (value) => {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${formatMoney(number)} so với hôm qua`;
  }

  if (number < 0) {
    return `-${formatMoney(Math.abs(number))} so với hôm qua`;
  }

  return 'Không đổi so với hôm qua';
};

const formatChangeNumber = (value) => {
  const number = Number(value || 0);

  if (number > 0) {
    return `+${formatNumber(number)} so với hôm qua`;
  }

  if (number < 0) {
    return `-${formatNumber(Math.abs(number))} so với hôm qua`;
  }

  return 'Không đổi so với hôm qua';
};

const getChangeClass = (value) => {
  const number = Number(value || 0);

  if (number < 0) return 'negative';

  return 'positive';
};

const getStatusInfo = (status) => {
  return STATUS_MAP[status] || {
    label: status || 'Không rõ',
    badge: 'badge-secondary',
  };
};

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const res = await adminDashboardAPI.getDashboard();

      setDashboard(res.data);
    } catch (error) {
      console.error('Lỗi tải dashboard:', error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const summary = dashboard?.summary || {};
  const recentOrders = dashboard?.recentOrders || [];
  const topFoods = dashboard?.topFoods || [];

  const stats = [
    {
      icon: '💰',
      label: 'Doanh thu hôm nay',
      value: formatMoney(summary.revenueToday),
      change: formatChangeMoney(summary.revenueChange),
      changeClass: getChangeClass(summary.revenueChange),
      color: '#e74c3c',
    },
    {
      icon: '📦',
      label: 'Đơn hàng hôm nay',
      value: formatNumber(summary.ordersToday),
      change: formatChangeNumber(summary.ordersChange),
      changeClass: getChangeClass(summary.ordersChange),
      color: '#3498db',
    },
    {
      icon: '👥',
      label: 'Khách hàng mới',
      value: formatNumber(summary.newCustomersToday),
      change: formatChangeNumber(summary.newCustomersChange),
      changeClass: getChangeClass(summary.newCustomersChange),
      color: '#9b59b6',
    },
    {
      icon: '🍔',
      label: 'Món ăn đang bán',
      value: formatNumber(summary.availableFoods),
      change: 'Đang hiển thị trên thực đơn',
      changeClass: 'positive',
      color: '#e67e22',
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="dashboard-time">
        {currentTime.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      {loading ? (
        <div className="dashboard-loading-card">
          Đang tải dữ liệu dashboard...
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div
                  className="stat-icon"
                  style={{
                    background: stat.color + '18',
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>

                <div className="stat-info">
                  <p className="stat-label">{stat.label}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                  <span className={`stat-change ${stat.changeClass}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-section">
              <div className="section-header-admin">
                <h3>📋 Đơn hàng mới nhất</h3>
                <a href="/admin/orders" className="see-all-admin">
                  Xem tất cả →
                </a>
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
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="dashboard-empty-cell">
                          Chưa có đơn hàng nào.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => {
                        const status = getStatusInfo(order.status);

                        return (
                          <tr key={order.id}>
                            <td>
                              <strong>
                                #{order.orderCode || order.id}
                              </strong>
                            </td>

                            <td>{order.customer || 'Khách hàng'}</td>

                            <td className="text-muted">
                              {order.items || 'Chưa có món'}
                            </td>

                            <td>
                              <strong>{formatMoney(order.total)}</strong>
                            </td>

                            <td>
                              <span className={`badge ${status.badge}`}>
                                {status.label}
                              </span>
                            </td>

                            <td className="text-muted">
                              {order.timeAgo || '--'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header-admin">
                <h3>🔥 Món bán chạy nhất</h3>
              </div>

              {topFoods.length === 0 ? (
                <div className="dashboard-empty-box">
                  Chưa có dữ liệu món bán chạy.
                </div>
              ) : (
                topFoods.map((food, index) => (
                  <div key={food.name || index} className="top-food-row">
                    <span className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </span>

                    <div className="top-food-info">
                      <strong>{food.name}</strong>
                      <span>Đã bán: {formatNumber(food.sold)} suất</span>
                    </div>

                    <span className="top-food-revenue">
                      {formatMoney(food.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;