import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminStatisticsAPI } from '../../services/api';
import './AdminStatistics.css';

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
};

const formatNumber = (value) => {
  return Number(value || 0).toLocaleString('vi-VN');
};

const formatGrowth = (value) => {
  const number = Number(value || 0);

  if (number > 0) {
    return `↑ ${number}% so với tháng trước`;
  }

  if (number < 0) {
    return `↓ ${Math.abs(number)}% so với tháng trước`;
  }

  return 'Không đổi so với tháng trước';
};

const getGrowthColor = (value) => {
  const number = Number(value || 0);

  if (number > 0) return '#27ae60';
  if (number < 0) return '#e74c3c';

  return '#888';
};

const buildDonutGradient = (items) => {
  if (!items || items.length === 0) {
    return '#f0f0f0';
  }

  let start = 0;

  const parts = items.map((item) => {
    const percent = Number(item.percent || 0);
    const end = start + percent;
    const color = item.color || '#ddd';
    const part = `${color} ${start}% ${end}%`;

    start = end;

    return part;
  });

  if (start <= 0) {
    return '#f0f0f0';
  }

  if (start < 100) {
    parts.push(`#f0f0f0 ${start}% 100%`);
  }

  return `conic-gradient(${parts.join(', ')})`;
};

const AdminStatistics = () => {
  const [period, setPeriod] = useState('week');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      const res = await adminStatisticsAPI.getOverview();

      setStatistics(res.data);
    } catch (error) {
      console.error('Lỗi tải thống kê admin:', error);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const summary = statistics?.summary || {};
  const revenueData = statistics?.revenue?.[period] || [];
  const statusDistribution = statistics?.statusDistribution || [];
  const topFoods = statistics?.topFoods || [];

  const maxValue = useMemo(() => {
    if (!revenueData.length) return 1;

    return Math.max(...revenueData.map((item) => Number(item.value || 0)), 1);
  }, [revenueData]);

  const totalRevenueChart = useMemo(() => {
    return revenueData.reduce(
      (sum, item) => sum + Number(item.value || 0),
      0
    );
  }, [revenueData]);

  const totalStatusOrders = useMemo(() => {
    return statusDistribution.reduce(
      (sum, item) => sum + Number(item.count || 0),
      0
    );
  }, [statusDistribution]);

  const summaryStats = [
    {
      icon: '💰',
      label: 'Doanh thu tháng này',
      value: formatMoney(summary.revenueThisMonth),
      sub: formatGrowth(summary.revenueGrowthPercent),
      color: getGrowthColor(summary.revenueGrowthPercent),
      bgColor: '#27ae6020',
    },
    {
      icon: '📦',
      label: 'Tổng đơn hàng',
      value: formatNumber(summary.totalOrders),
      sub: formatGrowth(summary.orderGrowthPercent),
      color: getGrowthColor(summary.orderGrowthPercent),
      bgColor: '#3498db20',
    },
    {
      icon: '👥',
      label: 'Khách hàng mới',
      value: formatNumber(summary.newCustomersThisMonth),
      sub: formatGrowth(summary.customerGrowthPercent),
      color: getGrowthColor(summary.customerGrowthPercent),
      bgColor: '#9b59b620',
    },
    {
      icon: '⭐',
      label: 'Đánh giá trung bình',
      value: `${Number(summary.averageRating || 0).toFixed(1)}/5.0`,
      sub: `Từ ${formatNumber(summary.ratingCount)} món có đánh giá`,
      color: '#f39c12',
      bgColor: '#f39c1220',
    },
  ];

  return (
    <AdminLayout title="📈 Thống kê & Báo cáo">
      {loading ? (
        <div className="card" style={{ padding: 28 }}>
          Đang tải dữ liệu thống kê...
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            {summaryStats.map((s, i) => (
              <div key={i} className="stat-card card">
                <div
                  className="stat-icon"
                  style={{
                    background: s.bgColor,
                    color: s.color,
                  }}
                >
                  {s.icon}
                </div>

                <div className="stat-info">
                  <p className="stat-label">{s.label}</p>
                  <h3 className="stat-value">{s.value}</h3>
                  <span style={{ fontSize: 12, color: s.color }}>
                    {s.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="stats-main-grid">
            <div className="card stats-chart-card">
              <div className="stats-card-header">
                <h3>📊 Biểu đồ doanh thu</h3>

                <div className="period-tabs">
                  {[
                    { key: 'week', label: 'Tuần này' },
                    { key: 'month', label: '6 tháng' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`period-btn ${
                        period === item.key ? 'active' : ''
                      }`}
                      onClick={() => setPeriod(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {revenueData.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#888' }}>
                  Chưa có dữ liệu doanh thu.
                </div>
              ) : (
                <>
                  <div className="bar-chart">
                    {revenueData.map((item, index) => {
                      const value = Number(item.value || 0);
                      const height = (value / maxValue) * 200;

                      return (
                        <div key={index} className="bar-col">
                          <div className="bar-value">
                            {(value / 1000000).toFixed(1)}M
                          </div>

                          <div className="bar-wrapper">
                            <div
                              className="bar"
                              style={{ height: `${height}px` }}
                            />
                          </div>

                          <div className="bar-label">{item.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="chart-total">
                    Tổng: <strong>{formatMoney(totalRevenueChart)}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="card stats-chart-card">
              <div className="stats-card-header">
                <h3>📋 Phân phối trạng thái đơn hàng</h3>
              </div>

              <div className="donut-chart-wrapper">
                <div
                  className="donut-chart"
                  style={{
                    background: buildDonutGradient(statusDistribution),
                  }}
                >
                  <div className="donut-center">
                    <strong>{formatNumber(totalStatusOrders)}</strong>
                    <span>Tổng đơn</span>
                  </div>
                </div>

                <div className="donut-legend">
                  {statusDistribution.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span
                        className="legend-dot"
                        style={{ background: item.color }}
                      />

                      <span className="legend-label">{item.label}</span>

                      <span className="legend-count">
                        {formatNumber(item.count)} ({item.percent}%)
                      </span>

                      <div className="legend-bar">
                        <div
                          style={{
                            width: `${item.percent}%`,
                            background: item.color,
                            height: '100%',
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginTop: 24 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              🔥 Top 5 món ăn bán chạy nhất
            </h3>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Tên món</th>
                  <th>Số lượng bán</th>
                  <th>Doanh thu</th>
                  <th>Tỉ lệ</th>
                </tr>
              </thead>

              <tbody>
                {topFoods.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: 24 }}>
                      Chưa có dữ liệu món bán chạy.
                    </td>
                  </tr>
                ) : (
                  topFoods.map((food, index) => (
                    <tr key={index}>
                      <td>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: [
                              '#ffd700',
                              '#c0c0c0',
                              '#cd7f32',
                              '#f0f0f0',
                              '#f0f0f0',
                            ][index],
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: 12,
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td>
                        <strong>{food.name}</strong>
                      </td>

                      <td>{formatNumber(food.sold)} suất</td>

                      <td>
                        <strong style={{ color: 'var(--success)' }}>
                          {formatMoney(food.revenue)}
                        </strong>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 8,
                              background: '#f0f0f0',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${food.percent}%`,
                                height: '100%',
                                background: 'var(--primary)',
                                borderRadius: 4,
                              }}
                            />
                          </div>

                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              minWidth: 35,
                            }}
                          >
                            {food.percent}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminStatistics;