import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import './CartPage.css';

// ==================== CART PAGE ====================

const CartPage = () => {
  // ==================== HOOKS ====================

  const { cartItems, updateQuantity, removeFromCart, clearCart, totalPrice } =
    useCart();
  const navigate = useNavigate();

  // ==================== CONSTANTS ====================

  const shippingFee = totalPrice >= 200000 ? 0 : 20000;
  const freeShipThreshold = 200000;
  const remainingForFreeShip = Math.max(0, freeShipThreshold - totalPrice);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const finalTotal = totalPrice + shippingFee;
  const shippingProgress = Math.min(100, Math.round((totalPrice / freeShipThreshold) * 100));

  // ==================== HANDLERS ====================

  const handleIncreaseQuantity = (item) => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      removeFromCart(item.id);
    }
  };

  // ==================== EMPTY CART RENDER ====================

  if (cartItems.length === 0) {
    return (
      <div className="page-wrapper">
        <Navbar />
        <div className="cart-empty-wrap">
          <div className="cart-empty-card">
            <div className="empty-icon">🛒</div>
            <h2>Giỏ hàng đang chờ món ngon!</h2>
            <p>Chọn món yêu thích, đặt nhanh và nhận giao hàng tận nơi.</p>
            <Link to="/menu" className="btn btn-primary btn-lg">
              Khám phá thực đơn
            </Link>
            <div className="empty-benefits">
              <span>🛵 Giao nhanh</span>
              <span>💳 Thanh toán tiện</span>
              <span>🥗 Món tươi ngon</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ==================== CART PAGE RENDER ====================

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="cart-page">
        <div className="container">
          {/* ========== CART HEADER ========== */}
          <header className="cart-header">
            <div>
              <span className="cart-kicker">ĐƠN HÀNG CỦA BẠN</span>
              <h1>Giỏ hàng của bạn</h1>
              <p>Kiểm tra món ăn, số lượng trước khi chuyển sang thanh toán.</p>
            </div>
            {cartItems.length > 0 && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={clearCart}
              >
                Xóa tất cả
              </button>
            )}
          </header>

          <div className="cart-benefit-bar">
            <span>🚀 Giao nhanh trong ngày</span>
            <span>🔒 Thanh toán bảo mật</span>
            <span>💬 Hỗ trợ đơn hàng nhanh</span>
          </div>

          <div className="cart-layout">
            {/* ========== CART ITEMS LIST ========== */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img
                    src={
                      item.imageUrl ||
                      'https://via.placeholder.com/100x100?text=Food'
                    }
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
                        <button onClick={() => handleDecreaseQuantity(item)}>
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button onClick={() => handleIncreaseQuantity(item)}>
                          +
                        </button>
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

            {/* ========== ORDER SUMMARY ========== */}
            <div className="cart-summary">
              <h3>Tóm tắt đơn hàng</h3>

              <div className="summary-row">
                <span>Số lượng</span>
                <strong>{totalQuantity} món</strong>
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

              {shippingFee > 0 ? (
                <div className="shipping-progress">
                  <p className="shipping-note">
                    Mua thêm <strong>{remainingForFreeShip.toLocaleString('vi-VN')}đ</strong> để được freeship
                  </p>
                  <div className="progress-track">
                    <span style={{ width: `${shippingProgress}%` }} />
                  </div>
                </div>
              ) : (
                <p className="shipping-complete">🎉 Bạn đã được miễn phí giao hàng!</p>
              )}

              <div className="summary-divider" />

              <div className="summary-total">
                <span>Tổng cộng</span>
                <strong className="total-amount">
                  {finalTotal.toLocaleString('vi-VN')}đ
                </strong>
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate('/checkout')}
              >
                Thanh toán ngay
              </button>

              <Link to="/menu" className="btn btn-outline btn-full mt-2">
                Tiếp tục mua sắm
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
