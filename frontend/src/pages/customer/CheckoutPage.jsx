import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: '',
    note: '',
    paymentMethod: 'COD'
  });

  const [loading, setLoading] = useState(false);
  const shippingFee = totalPrice >= 200000 ? 0 : 20000;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.phone || !form.address) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng!');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        ...form,
        items: cartItems,
        totalPrice: totalPrice + shippingFee,
        shippingFee
      };

      await api.post('/orders', orderData);

      clearCart();
      navigate('/orders', { state: { success: true } });
    } catch (err) {
      console.error(err);
      alert('Đặt hàng thất bại! Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="checkout-page">
        <div className="inner">
          <h1 className="checkout-title">📦 Thanh toán đơn hàng</h1>

          <div className="checkout-layout">
            {/* ==================== FORM BÊN TRÁI ==================== */}
            <div className="checkout-form">
              <div className="checkout-section card">
                <h3>👤 Thông tin giao hàng</h3>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <input 
                      name="fullName" 
                      value={form.fullName} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại *</label>
                    <input 
                      name="phone" 
                      value={form.phone} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Địa chỉ giao hàng *</label>
                  <input 
                    name="address" 
                    value={form.address} 
                    onChange={handleChange} 
                    required 
                    placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố" 
                  />
                </div>

                <div className="form-group">
                  <label>Ghi chú (tùy chọn)</label>
                  <textarea 
                    name="note" 
                    value={form.note} 
                    onChange={handleChange} 
                    rows={3} 
                    placeholder="Ví dụ: Giao trước 12h, không hành, chuông cửa..." 
                  />
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="checkout-section card">
                <h3>💳 Phương thức thanh toán</h3>
                <div className="payment-options">
                  <label className={`payment-option ${form.paymentMethod === 'COD' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="COD" 
                      checked={form.paymentMethod === 'COD'} 
                      onChange={handleChange} 
                    />
                    <div>
                      <strong>💵 Thanh toán khi nhận hàng (COD)</strong>
                      <p>Trả tiền mặt khi nhận hàng</p>
                    </div>
                  </label>

                  <label className={`payment-option ${form.paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      value="VNPAY" 
                      checked={form.paymentMethod === 'VNPAY'} 
                      onChange={handleChange} 
                    />
                    <div>
                      <strong>🏦 VNPAY</strong>
                      <p>Thanh toán qua cổng VNPAY an toàn</p>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                type="button"
                className="btn btn-primary btn-full checkout-btn"
                onClick={handleSubmit}
                disabled={loading || cartItems.length === 0}
              >
                {loading ? '⏳ Đang xử lý đơn hàng...' : '✅ Xác nhận đặt hàng'}
              </button>
            </div>

            {/* ==================== SUMMARY BÊN PHẢI ==================== */}
            <div className="checkout-summary card">
              <h3>🛍️ Đơn hàng của bạn</h3>
              
              <div className="checkout-items">
                {cartItems.map(item => (
                  <div key={item.id} className="checkout-item">
                    <span className="qty">{item.quantity}x</span>
                    <span className="name">{item.name}</span>
                    <span className="price">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />

              <div className="summary-row">
                <span>Tạm tính</span>
                <span>{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>

              <div className="summary-row">
                <span>Phí giao hàng</span>
                <span>
                  {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}đ`}
                </span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total">
                <strong>Tổng cộng</strong>
                <strong className="total-price">
                  {(totalPrice + shippingFee).toLocaleString('vi-VN')}đ
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;