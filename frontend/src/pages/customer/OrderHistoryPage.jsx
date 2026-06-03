import { useEffect, useMemo, useState } from "react";
import { getMyOrders, getOrderDetail } from "../../services/orderApi";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import logo from "../../logo.svg";
import "./OrderHistoryPage.css";

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "--";

  const statusMap = {
    ALL: { text: "Tất cả", icon: "🧾" },
    PENDING: { text: "Chờ xác nhận", color: "yellow", icon: "⏱" },
    CONFIRMED: { text: "Đã xác nhận", color: "blue", icon: "📦" },
    PREPARING: { text: "Đang chuẩn bị", color: "blue", icon: "👨‍🍳" },
    SHIPPING: { text: "Đang giao", color: "purple", icon: "🛵" },
    DELIVERING: { text: "Đang giao", color: "purple", icon: "🛵" },
    COMPLETED: { text: "Hoàn thành", color: "green", icon: "✅" },
    CANCELLED: { text: "Đã hủy", color: "red", icon: "✕" },
  };

  const tabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "COMPLETED", label: "Hoàn thành" },
    { key: "CANCELLED", label: "Đã hủy" },
  ];

  const getStatus = (status) =>
    statusMap[status] || {
      text: status || "Không rõ",
      color: "gray",
      icon: "•",
    };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi tải lịch sử đơn hàng:", error);
    } finally {
      setLoading(false);
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

  const filteredOrders = useMemo(() => {
    if (activeStatus === "ALL") return orders;
    return orders.filter((order) => order.status === activeStatus);
  }, [activeStatus, orders]);

  const getTabCount = (status) => {
    if (status === "ALL") return orders.length;
    return orders.filter((order) => order.status === status).length;
  };

  const getFirstItem = (order) => {
    const items = order.items || order.orderItems || [];
    return items[0] || null;
  };

  const getItemsCount = (order) => {
    const items = order.items || order.orderItems || [];
    return items.length;
  };

  const getShippingAddress = (order) =>
    order.shippingAddress || order.address || "Chưa có địa chỉ giao hàng";

  return (
    <>
      <Navbar />
      <main className="order-history-redesign">
        <section className="order-history-hero">
          <div className="order-history-container">
            <div className="order-history-title-wrap">
              <div>
                <span className="order-history-kicker">FoodStack Orders</span>
                <h1>Lịch sử đơn hàng</h1>
                <p>Theo dõi đơn hàng, trạng thái giao hàng và xem lại các món bạn đã đặt.</p>
              </div>
              <div className="order-history-summary">
                <span>{orders.length}</span>
                <small>đơn hàng</small>
              </div>
            </div>

            <div className="order-history-tabs">
              {tabs.map((tab) => {
                const status = getStatus(tab.key);
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveStatus(tab.key)}
                    className={`history-tab ${activeStatus === tab.key ? "active" : ""}`}
                  >
                    <span className="tab-icon">{status.icon}</span>
                    <span>{tab.label}</span>
                    <b>{getTabCount(tab.key)}</b>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="order-history-container order-history-content">
          {loading ? (
            <div className="order-history-empty">Đang tải lịch sử đơn hàng...</div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="orders-redesign-list">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  status={getStatus(order.status)}
                  firstItem={getFirstItem(order)}
                  itemsCount={getItemsCount(order)}
                  formatMoney={formatMoney}
                  formatDate={formatDate}
                  address={getShippingAddress(order)}
                  onViewDetail={() => viewDetail(order.id)}
                />
              ))}
            </div>
          )}
        </section>

        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            getStatus={getStatus}
            formatMoney={formatMoney}
            formatDate={formatDate}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

function OrderCard({
  order,
  status,
  firstItem,
  itemsCount,
  formatMoney,
  formatDate,
  address,
  onViewDetail,
}) {
  const extraItems = Math.max(itemsCount - 1, 0);
  const image = firstItem?.foodImage || firstItem?.image || logo;
  const name = firstItem?.foodName || firstItem?.name || "Đơn hàng FoodStack";
  const quantity = firstItem?.quantity || 1;

  return (
    <article className="order-redesign-card">
      <div className="order-card-head">
        <div className="order-code-block">
          <div className={`status-icon status-${status.color || "gray"}`}>{status.icon}</div>
          <div>
            <h3>Mã đơn: {order.orderCode || `#${order.id}`}</h3>
            <p>📅 {formatDate(order.createdAt || order.date)}</p>
          </div>
        </div>

        <div className="order-total-block">
          <span className={`status-pill status-${status.color || "gray"}`}>{status.text}</span>
          <strong>{formatMoney(order.totalAmount || order.total)}</strong>
        </div>
      </div>

      <div className="order-card-body">
        <div className="order-item-preview">

          <div className="order-item-info">
            <h4>{name}</h4>
            <p>Số lượng: {quantity}</p>
            {extraItems > 0 && <b>+{extraItems} món khác</b>}
            <div className="order-address">📍 {address}</div>
          </div>
        </div>

        <OrderTimeline status={order.status} />

        <div className="order-payment-row">
          <span>Thanh toán: {order.paymentMethod || "--"}</span>
          <span>{order.paymentStatus || "--"}</span>
        </div>

        <div className="order-actions">
          <button type="button" className="primary-action" onClick={onViewDetail}>
            👁 Xem chi tiết
          </button>
          <button type="button" className="secondary-action">
            ↻ Đặt lại
          </button>
          {order.status === "COMPLETED" && (
            <button type="button" className="review-action">
              💬 Đánh giá
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderTimeline({ status }) {
  const steps = [
    { key: "PENDING", label: "Đặt hàng" },
    { key: "CONFIRMED", label: "Xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "COMPLETED", label: "Hoàn thành" },
  ];

  const statusOrder = {
    PENDING: 0,
    CONFIRMED: 1,
    PREPARING: 1,
    SHIPPING: 2,
    DELIVERING: 2,
    COMPLETED: 3,
    CANCELLED: -1,
  };

  const activeIndex = statusOrder[status] ?? 0;

  if (status === "CANCELLED") {
    return <div className="cancelled-timeline">Đơn hàng đã bị hủy</div>;
  }

  return (
    <div className="order-timeline">
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`timeline-step ${index <= activeIndex ? "done" : ""}`}
        >
          <span>{index <= activeIndex ? "✓" : index + 1}</span>
          <p>{step.label}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="order-history-empty">
      <div>🧾</div>
      <h3>Chưa có đơn hàng nào</h3>
      <p>Các đơn hàng phù hợp với trạng thái này sẽ xuất hiện ở đây.</p>
    </div>
  );
}

function OrderDetailModal({ order, getStatus, formatMoney, formatDate, onClose }) {
  const status = getStatus(order.status);

  return (
    <div className="order-detail-overlay" onClick={onClose}>
      <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="order-detail-header">
          <div>
            <span>Chi tiết đơn hàng</span>
            <h2>{order.orderCode || `#${order.id}`}</h2>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </div>

        <div className="order-detail-body">
          <div className="detail-grid">
            <InfoBox label="Ngày đặt" value={formatDate(order.createdAt)} />
            <InfoBox label="Trạng thái" value={status.text} />
            <InfoBox label="Phương thức" value={order.paymentMethod || "--"} />
            <InfoBox label="Thanh toán" value={order.paymentStatus || "--"} />
          </div>

          <h3>Thông tin giao hàng</h3>
          <div className="shipping-box">
            <p><b>Người nhận:</b> {order.shippingName || "--"}</p>
            <p><b>SĐT:</b> {order.shippingPhone || "--"}</p>
            <p><b>Địa chỉ:</b> {order.shippingAddress || "--"}</p>
            <p><b>Ghi chú:</b> {order.note || "Không có"}</p>
          </div>

          <h3>Sản phẩm đã đặt</h3>
          <div className="detail-items">
            {order.items?.map((item) => (
              <div className="detail-item" key={item.id}>
                <img src={item.foodImage || logo} alt={item.foodName} />
                <div>
                  <h4>{item.foodName}</h4>
                  <p>Số lượng: {item.quantity}</p>
                  <p>Đơn giá: {formatMoney(item.unitPrice)}</p>
                </div>
                <strong>{formatMoney(item.subtotal)}</strong>
              </div>
            ))}
          </div>

          <div className="total-box">
            <Row label="Tạm tính" value={formatMoney(order.subtotal)} />
            <Row label="Phí giao hàng" value={formatMoney(order.shippingFee)} />
            <Row label="Tổng cộng" value={formatMoney(order.totalAmount)} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="info-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className={`total-row ${bold ? "bold" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default OrderHistoryPage;
