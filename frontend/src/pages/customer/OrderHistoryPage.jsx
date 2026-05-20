import { useEffect, useState } from "react";
import { getMyOrders, getOrderDetail } from "../../services/orderApi";
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeStatus, setActiveStatus] = useState("ALL");

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "";

  const statusMap = {
    PENDING: { text: "Chờ xác nhận", bg: "#fff3cd", color: "#856404" },
    CONFIRMED: { text: "Đã xác nhận", bg: "#d1ecf1", color: "#0c5460" },
    SHIPPING: { text: "Đang giao", bg: "#cce5ff", color: "#004085" },
    COMPLETED: { text: "Hoàn thành", bg: "#d4edda", color: "#155724" },
    CANCELLED: { text: "Đã hủy", bg: "#f8d7da", color: "#721c24" },
  };

  const getStatus = (status) =>
    statusMap[status] || { text: status || "Không rõ", bg: "#eee", color: "#333" };

  const loadOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error("Lỗi tải lịch sử đơn hàng:", error);
    }
  };

  const viewDetail = async (id) => {
    try {
      const data = await getOrderDetail(id);
      setSelectedOrder(data);
    } catch (error) {
      console.error("Lỗi xem chi tiết đơn hàng:", error);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders =
    activeStatus === "ALL"
      ? orders
      : orders.filter((order) => order.status === activeStatus);

  const tabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "COMPLETED", label: "Hoàn thành" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <>
      <Navbar />
      <div style={{ background: "#f5f6fa", minHeight: "100vh", padding: "32px 70px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2 style={{ fontSize: 30, marginBottom: 8, color: "#2d3436" }}>
          Lịch sử đơn hàng
        </h2>
        <p style={{ color: "#636e72", marginBottom: 24 }}>
          Theo dõi các đơn hàng bạn đã đặt tại FoodStack.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key)}
              style={{
                border: "none",
                padding: "10px 16px",
                borderRadius: 999,
                cursor: "pointer",
                background: activeStatus === tab.key ? "#e17055" : "#fff",
                color: activeStatus === tab.key ? "#fff" : "#2d3436",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 18,
              textAlign: "center",
              color: "#636e72",
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}
          >
            Chưa có đơn hàng nào trong mục này.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {filteredOrders.map((order) => {
              const status = getStatus(order.status);

              return (
                <div
                  key={order.id}
                  style={{
                    background: "#fff",
                    borderRadius: 18,
                    padding: 22,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    border: "1px solid #eee",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <h3 style={{ margin: 0, color: "#2d3436" }}>
                          Đơn hàng #{order.orderCode}
                        </h3>

                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            background: status.bg,
                            color: status.color,
                            fontSize: 13,
                            fontWeight: 700,
                          }}
                        >
                          {status.text}
                        </span>
                      </div>

                      <p style={{ margin: "10px 0 4px", color: "#636e72" }}>
                        Ngày đặt: {formatDate(order.createdAt)}
                      </p>
                      <p style={{ margin: 0, color: "#636e72" }}>
                        Thanh toán: {order.paymentMethod} - {order.paymentStatus}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, color: "#636e72" }}>Tổng tiền</p>
                      <h2 style={{ margin: "6px 0 14px", color: "#e17055" }}>
                        {formatMoney(order.totalAmount)}
                      </h2>

                      <button
                        onClick={() => viewDetail(order.id)}
                        style={{
                          border: "none",
                          padding: "11px 18px",
                          borderRadius: 10,
                          background: "linear-gradient(135deg, #ff7675, #e17055)",
                          color: "#fff",
                          cursor: "pointer",
                          fontWeight: 700,
                          boxShadow: "0 6px 14px rgba(225,112,85,0.35)",
                        }}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(45, 52, 54, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              width: 820,
              maxHeight: "92vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 22,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                padding: "24px 28px",
                background: "linear-gradient(135deg, #ff7675, #e17055)",
                color: "#fff",
                borderRadius: "22px 22px 0 0",
              }}
            >
              <h2 style={{ margin: 0 }}>Chi tiết đơn hàng</h2>
              <p style={{ margin: "8px 0 0" }}>#{selectedOrder.orderCode}</p>
            </div>

            <div style={{ padding: 28 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <InfoBox label="Ngày đặt" value={formatDate(selectedOrder.createdAt)} />
                <InfoBox label="Trạng thái" value={getStatus(selectedOrder.status).text} />
                <InfoBox label="Phương thức" value={selectedOrder.paymentMethod} />
                <InfoBox label="Thanh toán" value={selectedOrder.paymentStatus} />
              </div>

              <h3 style={{ color: "#2d3436" }}>Thông tin giao hàng</h3>
              <div
                style={{
                  background: "#f8f9fb",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 24,
                }}
              >
                <p><b>Người nhận:</b> {selectedOrder.shippingName}</p>
                <p><b>SĐT:</b> {selectedOrder.shippingPhone}</p>
                <p><b>Địa chỉ:</b> {selectedOrder.shippingAddress}</p>
                <p><b>Ghi chú:</b> {selectedOrder.note || "Không có"}</p>
              </div>

              <h3 style={{ color: "#2d3436" }}>Sản phẩm đã đặt</h3>

              {selectedOrder.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <img
                    src={item.foodImage}
                    alt={item.foodName}
                    style={{
                      width: 86,
                      height: 86,
                      objectFit: "cover",
                      borderRadius: 14,
                      background: "#eee",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 8px", color: "#2d3436" }}>
                      {item.foodName}
                    </h4>
                    <p style={{ margin: 0, color: "#636e72" }}>
                      Số lượng: {item.quantity}
                    </p>
                    <p style={{ margin: "4px 0", color: "#636e72" }}>
                      Đơn giá: {formatMoney(item.unitPrice)}
                    </p>
                  </div>

                  <div style={{ fontWeight: 700, color: "#e17055" }}>
                    {formatMoney(item.subtotal)}
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: 24,
                  background: "#fff7f4",
                  borderRadius: 16,
                  padding: 18,
                }}
              >
                <Row label="Tạm tính" value={formatMoney(selectedOrder.subtotal)} />
                <Row label="Phí giao hàng" value={formatMoney(selectedOrder.shippingFee)} />
                <Row
                  label="Tổng cộng"
                  value={formatMoney(selectedOrder.totalAmount)}
                  bold
                />
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  marginTop: 22,
                  width: "100%",
                  border: "none",
                  padding: "13px",
                  borderRadius: 12,
                  background: "#2d3436",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      <Footer />
    </>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ background: "#f8f9fb", borderRadius: 14, padding: 14 }}>
      <div style={{ color: "#636e72", fontSize: 13 }}>{label}</div>
      <div style={{ color: "#2d3436", fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10,
        fontSize: bold ? 20 : 15,
        fontWeight: bold ? 800 : 500,
        color: bold ? "#e17055" : "#2d3436",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default OrderHistoryPage;