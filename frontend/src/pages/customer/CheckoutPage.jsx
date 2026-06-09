// src/pages/customer/CheckoutPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { checkout, userVoucherAPI } from "../../services/checkoutApi";
import GoogleAddressPicker from "../../components/customer/GoogleAddressPicker";

import "./CheckoutPage.css";

const CheckoutPage = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const [form, setForm] = useState({
    shippingName: user?.fullName || "",
    shippingPhone: user?.phone || "",
    shippingAddress: "",
    shippingLat: null,
    shippingLng: null,
    shippingPlaceId: "",
    shippingDistanceKm: null,
    note: "",
    paymentMethod: "COD",
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const shippingFee = totalPrice >= 200000 ? 0 : 20000;
  const discountAmount = Number(appliedVoucher?.discountAmount || 0);
  const finalTotal = Math.max(0, totalPrice + shippingFee - discountAmount);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const getItemName = (item) =>
    item.name || item.foodName || item.title || "Món ăn";

  const getItemPrice = (item) =>
    item.price || item.unitPrice || item.discountPrice || 0;

  const paymentLabel =
    form.paymentMethod === "VNPAY"
      ? "VNPAY - Thanh toán online"
      : "COD - Thanh toán khi nhận hàng";

  const validateCheckoutInfo = () => {
    if (!token) {
      toast.warning("Vui lòng đăng nhập trước khi đặt hàng!");
      navigate("/login");
      return false;
    }

    if (!cartItems || cartItems.length === 0) {
      toast.info("Giỏ hàng đang trống!");
      return false;
    }

    if (
      !form.shippingName.trim() ||
      !form.shippingPhone.trim() ||
      !form.shippingAddress.trim()
    ) {
      toast.warning("Vui lòng nhập đầy đủ thông tin giao hàng!");
      return false;
    }

    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (addressData) => {
    setForm((prev) => ({
      ...prev,
      ...addressData,
    }));
  };

  const handleContinueToConfirm = (e) => {
    e.preventDefault();

    if (!validateCheckoutInfo()) return;

    setShowConfirm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim();

    if (!code) {
      setVoucherError("Vui lòng nhập mã voucher");
      setAppliedVoucher(null);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setVoucherError("Giỏ hàng đang trống, không thể áp dụng voucher");
      setAppliedVoucher(null);
      return;
    }

    try {
      setVoucherLoading(true);
      setVoucherError("");

      const res = await userVoucherAPI.applyVoucher({
        code,
        orderAmount: totalPrice,
      });

      setAppliedVoucher(res.data);
      setVoucherCode(res.data.code);
      toast.success("Áp dụng voucher thành công!");
    } catch (error) {
      console.error("Lỗi áp dụng voucher:", error);

      setAppliedVoucher(null);
      setVoucherError(
        error?.response?.data?.message || "Không thể áp dụng voucher"
      );
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const handleSubmit = async () => {
    if (!validateCheckoutInfo()) return;

    setLoading(true);

    try {
      const payload = {
        shippingName: form.shippingName.trim(),
        shippingPhone: form.shippingPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        shippingLat: form.shippingLat,
        shippingLng: form.shippingLng,
        shippingPlaceId: form.shippingPlaceId,
        shippingDistanceKm: form.shippingDistanceKm,
        note: form.note,
        paymentMethod: form.paymentMethod,

        voucherCode: appliedVoucher?.code || null,

        items: cartItems,
        shippingFee,
        totalPrice: finalTotal,
      };

      const data = await checkout(payload, token);

      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      clearCart();

      const successOrder = {
        orderCode: data?.orderCode || "",
        totalAmount: data?.totalAmount ?? finalTotal,
        paymentMethod: form.paymentMethod,
        voucherCode: appliedVoucher?.code || null,
        discountAmount,
      };

      sessionStorage.setItem(
        "latestSuccessfulOrder",
        JSON.stringify(successOrder)
      );

      navigate("/order-success", {
        replace: true,
        state: successOrder,
      });
    } catch (err) {
      console.error("Checkout error:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Đặt hàng thất bại! Vui lòng thử lại sau.";

      toast.error(
        typeof message === "string"
          ? message
          : "Đặt hàng thất bại! Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="checkout-page">
        <div className="inner">
          <header className="checkout-header">
            <div>
              <span className="checkout-kicker">THANH TOÁN AN TOÀN</span>
              <h1 className="checkout-title">Hoàn tất đơn hàng</h1>
              <p>
                {showConfirm
                  ? "Kiểm tra lại thông tin nhận món trước khi bấm đặt hàng."
                  : "Điền thông tin nhận món và lựa chọn phương thức thanh toán phù hợp."}
              </p>
            </div>

            <div className="checkout-steps" aria-label="Các bước đặt hàng">
              <div className="done">
                <b>✓</b>
                <span>Giỏ hàng</span>
              </div>

              <i />

              <div className={showConfirm ? "done" : "active"}>
                <b>{showConfirm ? "✓" : "2"}</b>
                <span>Thông tin</span>
              </div>

              <i />

              <div className={showConfirm ? "active" : ""}>
                <b>3</b>
                <span>Đặt hàng</span>
              </div>
            </div>
          </header>

          <form onSubmit={handleContinueToConfirm}>
            <div className="checkout-layout">
              <div className="checkout-form">
                {!showConfirm ? (
                  <>
                    <div className="checkout-section card">
                      <h3>Thông tin giao hàng</h3>

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

                        <GoogleAddressPicker
                          apiKey={GOOGLE_MAPS_API_KEY}
                          value={form.shippingAddress}
                          onChange={handleAddressChange}
                        />
                      </div>

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
                      <h3>Phương thức thanh toán</h3>

                      <div className="payment-options">
                        <label
                          className={`payment-option ${
                            form.paymentMethod === "COD" ? "active" : ""
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
                            <strong>Thanh toán khi nhận hàng COD</strong>
                            <p>Trả tiền mặt khi nhận hàng</p>
                          </div>
                        </label>

                        <label
                          className={`payment-option ${
                            form.paymentMethod === "VNPAY" ? "active" : ""
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
                            <strong>VNPAY</strong>
                            <p>Thanh toán qua cổng VNPAY</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-full checkout-btn"
                      disabled={cartItems.length === 0}
                    >
                      Xác nhận thông tin
                    </button>
                  </>
                ) : (
                  <div className="checkout-section checkout-confirm-card card">
                    <div className="confirm-banner">
                      <div>
                        <span>Bước cuối</span>
                        <h3>Xác nhận thông tin đặt hàng</h3>
                      </div>

                      <p>
                        Vui lòng kiểm tra lại thông tin bên dưới. Nếu đã đúng,
                        bấm “Đặt hàng ngay”.
                      </p>
                    </div>

                    <div className="confirm-grid">
                      <div className="confirm-item">
                        <span>Người nhận</span>
                        <strong>{form.shippingName}</strong>
                      </div>

                      <div className="confirm-item">
                        <span>Số điện thoại</span>
                        <strong>{form.shippingPhone}</strong>
                      </div>

                      <div className="confirm-item confirm-item-full">
                        <span>Địa chỉ giao hàng</span>
                        <strong>{form.shippingAddress}</strong>
                      </div>

                      {form.shippingLat && form.shippingLng && (
                        <div className="confirm-item">
                          <span>Tọa độ giao hàng</span>
                          <strong>
                            {Number(form.shippingLat).toFixed(6)},{" "}
                            {Number(form.shippingLng).toFixed(6)}
                          </strong>
                        </div>
                      )}

                      {form.shippingDistanceKm && (
                        <div className="confirm-item">
                          <span>Khoảng cách dự kiến</span>
                          <strong>{form.shippingDistanceKm} km</strong>
                        </div>
                      )}

                      <div className="confirm-item">
                        <span>Thanh toán</span>
                        <strong>{paymentLabel}</strong>
                      </div>

                      {appliedVoucher && (
                        <div className="confirm-item">
                          <span>Voucher</span>
                          <strong>
                            {appliedVoucher.code} - Giảm{" "}
                            {formatCurrency(discountAmount)}
                          </strong>
                        </div>
                      )}

                      <div className="confirm-item">
                        <span>Ghi chú</span>
                        <strong>{form.note.trim() || "Không có ghi chú"}</strong>
                      </div>
                    </div>

                    <div className="confirm-products">
                      <h4>Món đã chọn</h4>

                      {cartItems.map((item) => (
                        <div key={item.id} className="confirm-product-row">
                          <span>
                            {item.quantity}x {getItemName(item)}
                          </span>

                          <strong>
                            {formatCurrency(getItemPrice(item) * item.quantity)}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div className="checkout-actions">
                      <button
                        type="button"
                        className="btn btn-secondary checkout-back-btn"
                        onClick={() => setShowConfirm(false)}
                        disabled={loading}
                      >
                        ← Chỉnh sửa thông tin
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary checkout-order-btn"
                        onClick={handleSubmit}
                        disabled={loading || cartItems.length === 0}
                      >
                        {loading ? "⏳ Đang xử lý đơn hàng..." : "Đặt hàng ngay"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="checkout-summary card">
                <h3>Đơn hàng của bạn</h3>

                <p className="summary-caption">
                  Thông tin giá được hiển thị minh bạch trước khi đặt món.
                </p>

                <div className="checkout-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <span className="qty">{item.quantity}x</span>

                      <span className="name">{getItemName(item)}</span>

                      <span className="price">
                        {formatCurrency(getItemPrice(item) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="voucher-box">
                  <div className="voucher-title-row">
                    <div>
                      <strong>Mã giảm giá</strong>
                      <p>Nhập voucher để được giảm giá đơn hàng</p>
                    </div>

                    {appliedVoucher && (
                      <button
                        type="button"
                        className="voucher-remove-btn"
                        onClick={handleRemoveVoucher}
                      >
                        Bỏ mã
                      </button>
                    )}
                  </div>

                  <div className="voucher-input-row">
                    <input
                      value={voucherCode}
                      onChange={(event) => {
                        setVoucherCode(event.target.value.toUpperCase());
                        setVoucherError("");
                      }}
                      placeholder="Nhập mã voucher..."
                      disabled={voucherLoading || !!appliedVoucher}
                    />

                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={
                        voucherLoading ||
                        !!appliedVoucher ||
                        cartItems.length === 0
                      }
                    >
                      {voucherLoading ? "Đang áp..." : "Áp dụng"}
                    </button>
                  </div>

                  {voucherError && (
                    <div className="voucher-message error">{voucherError}</div>
                  )}

                  {appliedVoucher && (
                    <div className="voucher-message success">
                      <strong>{appliedVoucher.code}</strong> -{" "}
                      {appliedVoucher.name}
                      <br />
                      Đã giảm {formatCurrency(appliedVoucher.discountAmount)}
                    </div>
                  )}
                </div>

                <div className="summary-divider" />

                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>

                <div className="summary-row">
                  <span>Phí giao hàng</span>
                  <span>
                    {shippingFee === 0
                      ? "Miễn phí"
                      : formatCurrency(shippingFee)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="summary-row discount-row">
                    <span>Giảm giá voucher</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="summary-divider" />

                <div className="summary-total">
                  <strong>Tổng cộng</strong>
                  <strong className="total-price">
                    {formatCurrency(finalTotal)}
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