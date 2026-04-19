import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import './AdminStatistics.css';

const REVENUE_DATA = {
  week: [
    { label: 'T2', value: 1800000 }, { label: 'T3', value: 2200000 },
    { label: 'T4', value: 1950000 }, { label: 'T5', value: 2800000 },
    { label: 'T6', value: 3200000 }, { label: 'T7', value: 3800000 }, { label: 'CN', value: 2450000 },
  ],
  month: [
    { label: 'T1', value: 45000000 }, { label: 'T2', value: 52000000 },
    { label: 'T3', value: 48000000 }, { label: 'T4', value: 61000000 },
    { label: 'T5', value: 58000000 }, { label: 'T6', value: 72000000 },
  ],
};

const TOP_FOODS = [
  { name: 'Phở Bò Đặc Biệt', sold: 248, revenue: 18600000, percent: 100 },
  { name: 'Cơm Tấm Sườn Nướng', sold: 196, revenue: 12740000, percent: 79 },
  { name: 'Trà Sữa Trân Châu', sold: 312, revenue: 10920000, percent: 59 },
  { name: 'Bún Bò Huế', sold: 154, revenue: 10780000, percent: 58 },
  { name: 'Bánh Mì Thịt Nướng', sold: 389, revenue: 9725000, percent: 52 },
];

const SUMMARY_STATS = [
  { icon: '💰', label: 'Doanh thu tháng này', value: '72,000,000đ', sub: '↑ 24% so với tháng trước', color: '#27ae60' },
  { icon: '📦', label: 'Tổng đơn hàng', value: '1,248', sub: '↑ 18% so với tháng trước', color: '#3498db' },
  { icon: '👥', label: 'Khách hàng mới', value: '183', sub: '↑ 12% so với tháng trước', color: '#9b59b6' },
  { icon: '⭐', label: 'Đánh giá trung bình', value: '4.8/5.0', sub: 'Từ 1,024 đánh giá', color: '#f39c12' },
];

const AdminStatistics = () => {
  const [period, setPeriod] = useState('week');
  const data = REVENUE_DATA[period];
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <AdminLayout title="📈 Thống kê & Báo cáo">
      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {SUMMARY_STATS.map((s, i) => (
          <div key={i} className="stat-card card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>{s.icon}</div>
            <div className="stat-info">
              <p className="stat-label">{s.label}</p>
              <h3 className="stat-value">{s.value}</h3>
              <span style={{ fontSize: 12, color: s.color }}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="stats-main-grid">
        {/* Revenue Chart */}
        <div className="card stats-chart-card">
          <div className="stats-card-header">
            <h3>📊 Biểu đồ doanh thu</h3>
            <div className="period-tabs">
              {[{ key: 'week', label: 'Tuần này' }, { key: 'month', label: '6 tháng' }].map(p => (
                <button
                  key={p.key}
                  className={`period-btn ${period === p.key ? 'active' : ''}`}
                  onClick={() => setPeriod(p.key)}
                >{p.label}</button>
              ))}
            </div>
          </div>
          <div className="bar-chart">
            {data.map((d, i) => {
              const height = (d.value / maxValue) * 200;
              return (
                <div key={i} className="bar-col">
                  <div className="bar-value">{(d.value / 1000000).toFixed(1)}M</div>
                  <div className="bar-wrapper">
                    <div className="bar" style={{ height: `${height}px` }} />
                  </div>
                  <div className="bar-label">{d.label}</div>
                </div>
              );
            })}
          </div>
          <div className="chart-total">
            Tổng: <strong>{data.reduce((s, d) => s + d.value, 0).toLocaleString('vi-VN')}đ</strong>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="card stats-chart-card">
          <div className="stats-card-header">
            <h3>📋 Phân phối trạng thái đơn hàng</h3>
          </div>
          <div className="donut-chart-wrapper">
            <div className="donut-chart">
              <div className="donut-center">
                <strong>1,248</strong>
                <span>Tổng đơn</span>
              </div>
            </div>
            <div className="donut-legend">
              {[
                { label: 'Hoàn thành', count: 892, percent: 71, color: '#27ae60' },
                { label: 'Đang giao', count: 156, percent: 13, color: '#3498db' },
                { label: 'Đang chuẩn bị', count: 124, percent: 10, color: '#f39c12' },
                { label: 'Chờ xác nhận', count: 48, percent: 4, color: '#e67e22' },
                { label: 'Đã hủy', count: 28, percent: 2, color: '#e74c3c' },
              ].map((item, i) => (
                <div key={i} className="legend-item">
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span className="legend-label">{item.label}</span>
                  <span className="legend-count">{item.count} ({item.percent}%)</span>
                  <div className="legend-bar"><div style={{ width: `${item.percent}%`, background: item.color, height: '100%', borderRadius: 4 }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Foods Table */}
      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🔥 Top 5 món ăn bán chạy nhất</h3>
        <table className="admin-table">
          <thead>
            <tr><th>Hạng</th><th>Tên món</th><th>Số lượng bán</th><th>Doanh thu</th><th>Tỉ lệ</th></tr>
          </thead>
          <tbody>
            {TOP_FOODS.map((food, i) => (
              <tr key={i}>
                <td>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: ['#ffd700','#c0c0c0','#cd7f32','#f0f0f0','#f0f0f0'][i], display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>
                    {i + 1}
                  </span>
                </td>
                <td><strong>{food.name}</strong></td>
                <td>{food.sold} suất</td>
                <td><strong style={{ color: 'var(--success)' }}>{food.revenue.toLocaleString('vi-VN')}đ</strong></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${food.percent}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 35 }}>{food.percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default AdminStatistics;
