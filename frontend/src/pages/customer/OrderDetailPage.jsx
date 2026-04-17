import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import './OrderDetailPage.css';

const STATUS_STEPS = ['PENDING', 'PREPARING', 'DELIVERING', 'COMPLETED'];
const STATUS_MAP = {
  PENDING:   { label: 'Chờ xác nhận', icon: '⏳', color: '#f39c12' },
  PREPARING: { label: 'Đang chuẩn bị', icon: '👨‍🍳', color: '#3498db' },
  DELIVERING:{ label: 'Đang giao',     icon: '🚗', color: '#e67e22' },
  COMPLETED: { label: 'Hoàn thành',    icon: '✅', color: '#27ae60' },
  CANCELLED: { label: 'Đã hủy',        icon: '❌', color: '#e74c3c' },
};

const MOCK_ORDER = {
  id: 1001,
  date: '2025-06-15 14:30',
  status: 'DELIVERING',
  fullName: 'Lê Minh Công',
  phone: '0901234567',
  address: '123 Nguyễn Văn Cừ, P.4, Q.5, TP.HCM',
  paymentMethod: 'COD',
  note: 'Giao trước cổng',
  items: [
    { id: 1, name: 'Phở Bò Đặc Biệt', price: 75000, quantity: 1 },
    { id: 4, name: 'Trà Sữa Trân Châu', price: 35000, quantity: 2 },
  ],
  shippingFee: 20000,
  totalPrice: 165000,
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const order = { ...MOCK_ORDER, id: Number(id) || 1001 };
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="order-detail-page">
        <div className="inner">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>

          <div className="order-header">
            <h1>Đơn hàng #{order.id}</h1>
            <span className={`status-badge ${order.status.toLowerCase()}`}>
              {STATUS_MAP[order.status]?.icon} {STATUS_MAP[order.status]?.label}
            </span>
          </div>

          {/* Progress Tracker */}
          {!isCancelled && (
            <div className="status-tracker card">
              <h3>📍 Trạng thái đơn hàng</h3>
              <div className="tracker-steps">
                {STATUS_STEPS.map((step, idx) => (
                  <div 
                    key={step} 
                    className={`tracker-step ${idx <= currentStep ? 'done' : ''} ${idx === currentStep ? 'current' : ''}`}
                  >
                    <div className="step-dot">
                      {idx < currentStep ? '✓' : idx + 1}
                    </div>
                    <div className="step-label">
                      <span>{STATUS_MAP[step].icon}</span>
                      <span>{STATUS_MAP[step].label}</span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`step-line ${idx < currentStep ? 'done' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="order-detail-layout">
            {/* Danh sách món */}
            <div className="order-items-section card">
              <h3>🛍️ Danh sách món</h3>
              {order.items.map(item => (
                <div key={item.id} className="order-detail-item">
                  <div className="item-info">
                    <strong>{item.name}</strong>
                    <span>{item.price.toLocaleString('vi-VN')}đ × {item.quantity}</span>
                  </div>
                  <span className="item-total">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))}

              <div className="order-price-summary">
                <div className="price-row">
                  <span>Tạm tính</span>
                  <span>{(order.totalPrice - order.shippingFee).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="price-row">
                  <span>Phí giao hàng</span>
                  <span>{order.shippingFee.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="price-row total">
                  <span>Tổng cộng</span>
                  <strong>{order.totalPrice.toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>
            </div>

            {/* Thông tin giao hàng & Thanh toán */}
            <div className="delivery-info-section">
              <div className="card info-card">
                <h3>📦 Thông tin giao hàng</h3>
                <div className="info-row"><span>Người nhận:</span> <strong>{order.fullName}</strong></div>
                <div className="info-row"><span>Điện thoại:</span> <strong>{order.phone}</strong></div>
                <div className="info-row"><span>Địa chỉ:</span> <strong>{order.address}</strong></div>
                {order.note && <div className="info-row"><span>Ghi chú:</span> <strong>{order.note}</strong></div>}
              </div>

              <div className="card info-card">
                <h3>💳 Thanh toán</h3>
                <div className="info-row">
                  <span>Phương thức:</span> 
                  <strong>{order.paymentMethod === 'COD' ? '💵 Tiền mặt' : '🏦 VNPAY'}</strong>
                </div>
                <div className="info-row"><span>Ngày đặt:</span> <strong>{order.date}</strong></div>
              </div>

              {order.status === 'PENDING' && (
                <button className="btn btn-danger btn-full">❌ Hủy đơn hàng</button>
              )}
              {order.status === 'COMPLETED' && (
                <button className="btn btn-primary btn-full">⭐ Đánh giá đơn hàng</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderDetailPage;