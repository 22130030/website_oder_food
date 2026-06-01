import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import "./OrderSuccessPage.css";

const readSavedOrder = () => {
  try {
    const savedOrder = sessionStorage.getItem("latestSuccessfulOrder");
    return savedOrder ? JSON.parse(savedOrder) : null;
  } catch (error) {
    return null;
  }
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const orderInfo = location.state || readSavedOrder() || {};
  const {
    orderCode = "",
    totalAmount = 0,
    paymentMethod = "COD",
  } = orderInfo;

  return (
    <div className="success-page-wrapper">
      <Navbar />

      <main className="order-success-page">
        <section className="success-card">
          <div className="success-icon">
            <span>✓</span>
          </div>

          <h1>Đặt hàng thành công!</h1>
          <p className="success-description">
            Cảm ơn bạn đã đặt món tại <strong>NLU-FoodStack</strong>.
            Đơn hàng của bạn đã được tiếp nhận và đang chờ xác nhận.
          </p>

          <div className="success-order-box">
            <div className="success-order-row">
              <span>Mã đơn hàng</span>
              <strong>{orderCode ? `#${orderCode}` : "Đang cập nhật"}</strong>
            </div>

            <div className="success-order-row">
              <span>Phương thức thanh toán</span>
              <strong>
                {paymentMethod === "COD"
                  ? "Thanh toán khi nhận hàng"
                  : "VNPAY"}
              </strong>
            </div>

            {totalAmount > 0 && (
              <div className="success-order-row success-total">
                <span>Tổng thanh toán</span>
                <strong>{formatMoney(totalAmount)}</strong>
              </div>
            )}
          </div>

          <div className="success-progress">
            <div className="success-step active">
              <span className="step-circle">✓</span>
              <p>Đã đặt hàng</p>
            </div>

            <div className="step-line" />

            <div className="success-step">
              <span className="step-circle">2</span>
              <p>Chờ xác nhận</p>
            </div>

            <div className="step-line" />

            <div className="success-step">
              <span className="step-circle">3</span>
              <p>Giao hàng</p>
            </div>
          </div>

          <div className="success-actions">
            <button
              type="button"
              className="success-btn success-btn-primary"
              onClick={() => navigate("/orders")}
            >
              Xem lịch sử đơn hàng
            </button>

            <button
              type="button"
              className="success-btn success-btn-secondary"
              onClick={() => navigate("/home")}
            >
              Quay lại trang chủ
            </button>
          </div>

          <p className="success-support">
            Cần hỗ trợ về đơn hàng? Vào mục <strong>Hỗ trợ</strong> để liên hệ với cửa hàng.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
