import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const shippingFee = totalPrice >= 200000 ? 0 : 20000;

  if (cartItems.length === 0) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="cart-empty-wrap">
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <h2>Giỏ hàng trống!</h2>
            <p>Bạn chưa thêm món nào vào giỏ hàng.</p>
            <Link to="/menu" className="btn btn-primary btn-lg">
              Xem thực đơn
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="cart-page">
        <div className="container">
          <div className="cart-header">
            <h1>
              <span className="emoji">🛒</span> Giỏ hàng của bạn
            </h1>
            {cartItems.length > 0 && (
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={clearCart}
              >
                🗑️ Xóa tất cả
              </button>
            )}
          </div>

          <div className="cart-layout">
            {/* Danh sách sản phẩm */}
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img 
                    src={item.imageUrl || 'https://via.placeholder.com/100x100?text=Food'} 
                    alt={item.name} 
                  />
                  <div className="item-info">
                    <h3>{item.name}</h3>
                    <span className="item-category">{item.category}</span>

                    <div className="item-price-row">
                      <div className="item-unit-price">
                        {item.price.toLocaleString('vi-VN')}đ
                      </div>

                      <div className="item-qty">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>

                      <div className="item-subtotal">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </div>

                      <button 
                        className="remove-btn" 
                        onClick={() => removeFromCart(item.id)}
                        title="Xóa món"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tóm tắt đơn hàng */}
            <div className="cart-summary">
              <h3>📋 Tóm tắt đơn hàng</h3>
              
              <div className="summary-row">
                <span>Số lượng</span>
                <strong>{totalItems} món</strong>
              </div>
              <div className="summary-row">
                <span>Tạm tính</span>
                <strong>{totalPrice.toLocaleString('vi-VN')}đ</strong>
              </div>
              <div className="summary-row">
                <span>Phí giao hàng</span>
                <strong>
                  {shippingFee === 0 ? (
                    <span className="free-ship">Miễn phí</span>
                  ) : (
                    `${shippingFee.toLocaleString('vi-VN')}đ`
                  )}
                </strong>
              </div>

              {shippingFee > 0 && (
                <p className="shipping-note">
                  Mua thêm {(200000 - totalPrice).toLocaleString('vi-VN')}đ để được freeship
                </p>
              )}

              <div className="summary-divider" />

              <div className="summary-total">
                <span>Tổng cộng</span>
                <strong className="total-amount">
                  {(totalPrice + shippingFee).toLocaleString('vi-VN')}đ
                </strong>
              </div>

              <button 
                className="btn btn-primary btn-full" 
                onClick={() => navigate('/checkout')}
              >
                🚀 Thanh toán ngay
              </button>

              <Link to="/menu" className="btn btn-outline btn-full mt-2">
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;