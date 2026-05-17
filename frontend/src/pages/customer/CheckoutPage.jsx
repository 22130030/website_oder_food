import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { checkout } from "../../services/checkoutApi";

import "./CheckoutPage.css";

const CheckoutPage = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    shippingName: user?.fullName || "",
    shippingPhone: user?.phone || "",
    shippingAddress: "",
    shippingLat: null,
    shippingLng: null,
    shippingPlaceId: "",
    shippingDistanceKm: null,
    note: "",
    paymentMethod: "COD"
  });

  const [loading, setLoading] = useState(false);

  const shippingFee = totalPrice >= 200000 ? 0 : 20000;
  const finalTotal = totalPrice + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Vui lòng đăng nhập trước khi đặt hàng!");
      navigate("/login");
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      alert("Giỏ hàng đang trống!");
      return;
    }

    if (!form.shippingName || !form.shippingPhone || !form.shippingAddress) {
      alert("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        shippingName: form.shippingName,
        shippingPhone: form.shippingPhone,
        shippingAddress: form.shippingAddress,
        shippingLat: form.shippingLat,
        shippingLng: form.shippingLng,
        shippingPlaceId: form.shippingPlaceId,
        shippingDistanceKm: form.shippingDistanceKm,
        note: form.note,
        paymentMethod: form.paymentMethod,

        items: cartItems,
        shippingFee,
        totalPrice: finalTotal
      };

      const data = await checkout(payload, token);

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      clearCart();

      alert(`Đặt hàng COD thành công: ${data?.orderCode || ""}`);

      navigate("/orders", {
        state: { success: true }
      });
    } catch (err) {
      console.error("Checkout error:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Đặt hàng thất bại! Vui lòng thử lại sau.";

      alert(message);
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

          <form onSubmit={handleSubmit}>
            <div className="checkout-layout">
              <div className="checkout-form">
                <div className="checkout-section card">
                  <h3>👤 Thông tin giao hàng</h3>

                  <div className="grid-2">
                    <div className="form-group">
                      <label>Họ và tên *</label>
                      <input
                        name="shippingName"
                        value={form.shippingName}
                        onChange={handleChange}
                        required
                        placeholder="Nhập họ tên người nhận"
                      />
                    </div>

                    <div className="form-group">
                      <label>Số điện thoại *</label>
                      <input
                        name="shippingPhone"
                        value={form.shippingPhone}
                        onChange={handleChange}
                        required
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ giao hàng *</label>
                    <input
                      name="shippingAddress"
                      value={form.shippingAddress}
                      onChange={handleChange}
                      required
                      placeholder="Nhập địa chỉ giao hàng"
                    />
                  </div>

                  {form.shippingAddress && (
                    <div className="form-group">
                      <label>Địa chỉ đã chọn</label>
                      <input value={form.shippingAddress} readOnly />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Ghi chú tùy chọn</label>
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Ví dụ: Giao trước 12h, không hành, chuông cửa..."
                    />
                  </div>
                </div>

                <div className="checkout-section card">
                  <h3>💳 Phương thức thanh toán</h3>

                  <div className="payment-options">
                    <label
                      className={`payment-option ${form.paymentMethod === "COD" ? "active" : ""
                        }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={form.paymentMethod === "COD"}
                        onChange={handleChange}
                      />

                      <div>
                        <strong>💵 Thanh toán khi nhận hàng COD</strong>
                        <p>Trả tiền mặt khi nhận hàng</p>
                      </div>
                    </label>

                    <label
                      className={`payment-option ${form.paymentMethod === "VNPAY" ? "active" : ""
                        }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="VNPAY"
                        checked={form.paymentMethod === "VNPAY"}
                        onChange={handleChange}
                      />

                      <div>
                        <strong>🏦 VNPAY</strong>
                        <p>Thanh toán qua cổng VNPAY</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full checkout-btn"
                  disabled={loading || cartItems.length === 0}
                >
                  {loading
                    ? "⏳ Đang xử lý đơn hàng..."
                    : "✅ Xác nhận đặt hàng"}
                </button>
              </div>

              <div className="checkout-summary card">
                <h3>🛍️ Đơn hàng của bạn</h3>

                <div className="checkout-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <span className="qty">{item.quantity}x</span>
                      <span className="name">
                        {item.name || item.foodName || item.title}
                      </span>
                      <span className="price">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider" />

                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{totalPrice.toLocaleString("vi-VN")}đ</span>
                </div>

                <div className="summary-row">
                  <span>Phí giao hàng</span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString("vi-VN")}đ`}
                  </span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <strong>Tổng cộng</strong>
                  <strong className="total-price">
                    {finalTotal.toLocaleString("vi-VN")}đ
                  </strong>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CheckoutPage;