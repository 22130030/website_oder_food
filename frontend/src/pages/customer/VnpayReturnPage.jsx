import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "../../context/CartContext";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { handleVnpayReturn } from "../../services/checkoutApi";

import "./OrderSuccessPage.css";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN") + "đ";

const VnpayReturnPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("Đang kiểm tra kết quả thanh toán...");

  const params = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const orderCode = params.get("vnp_TxnRef") || "";
  const responseCode = params.get("vnp_ResponseCode") || "";
  const transactionStatus = params.get("vnp_TransactionStatus") || "";
  const amount = Number(params.get("vnp_Amount") || 0) / 100;
  const { clearCart, loadCartFromDatabase } = useCart();

  useEffect(() => {
    const processVnpayReturn = async () => {
      try {
        await handleVnpayReturn(location.search);

        const paidSuccess =
          responseCode === "00" && transactionStatus === "00";

        if (paidSuccess) {
  clearCart();

  if (loadCartFromDatabase) {
    await loadCartFromDatabase();
  }

  const successOrder = {
    orderCode,
    totalAmount: amount,
    paymentMethod: "VNPAY",
  };

  sessionStorage.setItem(
    "latestSuccessfulOrder",
    JSON.stringify(successOrder)
  );

  setIsSuccess(true);
  setMessage("Thanh toán VNPay thành công!");

  setTimeout(() => {
    navigate("/order-success", {
      replace: true,
      state: successOrder,
    });
  }, 1200);
        } else {
          setIsSuccess(false);
          setMessage("Thanh toán VNPay không thành công hoặc đã bị hủy.");
        }
      } catch (error) {
        console.error("VNPay return error:", error);

        setIsSuccess(false);
        setMessage(
          error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Không thể xác thực kết quả thanh toán VNPay."
        );

        toast.error("Xử lý thanh toán VNPay thất bại!");
      } finally {
        setLoading(false);
      }
    };

    processVnpayReturn();
  }, [location.search, responseCode, transactionStatus, orderCode, amount, navigate]);

  return (
    <div className="success-page-wrapper">
      <Navbar />

      <main className="order-success-page">
        <section className="success-card">
          <div className="success-icon">
            <span>{loading ? "…" : isSuccess ? "✓" : "!"}</span>
          </div>

          <h1>
            {loading
              ? "Đang xử lý thanh toán"
              : isSuccess
              ? "Thanh toán thành công!"
              : "Thanh toán thất bại"}
          </h1>

          <p className="success-description">{message}</p>

          <div className="success-order-box">
            <div className="success-order-row">
              <span>Mã đơn hàng</span>
              <strong>{orderCode ? `#${orderCode}` : "Không có"}</strong>
            </div>

            <div className="success-order-row">
              <span>Phương thức thanh toán</span>
              <strong>VNPAY</strong>
            </div>

            {amount > 0 && (
              <div className="success-order-row success-total">
                <span>Số tiền</span>
                <strong>{formatMoney(amount)}</strong>
              </div>
            )}
          </div>

          {!loading && !isSuccess && (
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
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VnpayReturnPage;