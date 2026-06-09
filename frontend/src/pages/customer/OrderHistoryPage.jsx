import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { getMyOrders, getOrderDetail, cancelOrder,createReview, } from "../../services/orderApi";
import { toast } from "react-toastify";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { foodAPI } from "../../services/api";
import "./OrderHistoryPage.css";

const FOOD_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop stop-color="#fff4e8"/>
        <stop offset="1" stop-color="#ffe0cf"/>
      </linearGradient>
    </defs>
    <rect width="140" height="140" rx="26" fill="url(#bg)"/>
    <circle cx="70" cy="66" r="35" fill="#fff" stroke="#f45139" stroke-width="4"/>
    <path d="M39 68h62c-2 18-15 30-31 30S41 86 39 68Z" fill="#f45139"/>
    <path d="M48 61c8-8 15 6 23-3s14 5 23-3" fill="none" stroke="#ffae45" stroke-width="6" stroke-linecap="round"/>
    <path d="M46 102h48" stroke="#e03c2d" stroke-width="5" stroke-linecap="round"/>
    <text x="70" y="121" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#bd4d34">MÓN NGON</text>
  </svg>
`)}`;

const getOrderItems = (order) =>
  order?.items ||
  order?.orderItems ||
  order?.orderDetails ||
  order?.details ||
  [];

const getRawItemImage = (item) =>
  item?.foodImage ||
  item?.foodImageUrl ||
  item?.imageUrl ||
  item?.image ||
  item?.productImage ||
  item?.productImageUrl ||
  item?.food?.imageUrl ||
  item?.food?.image ||
  item?.product?.imageUrl ||
  item?.product?.image ||
  item?.resolvedImage ||
  "";

const getItemImage = (item) => getRawItemImage(item) || FOOD_PLACEHOLDER;

const getItemName = (item) =>
  item?.foodName ||
  item?.productName ||
  item?.name ||
  item?.food?.name ||
  item?.product?.name ||
  item?.resolvedName ||
  "Món ăn đã đặt";

const getFoodId = (item) =>
  item?.foodItemId ||
  item?.foodId ||
  item?.productId ||
  item?.food?.id ||
  item?.product?.id;

const normalizeStatus = (status) => {
  if (status === "CONFIRMED") return "PREPARING";
  if (status === "SHIPPING") return "DELIVERING";
  return status;
};
const canReorderOrder = (order) => {
  return normalizeStatus(order?.status) === "COMPLETED";
};
const canUserCancelOrder = (order) => {
  const status = normalizeStatus(order?.status);
  const paymentMethod = (order?.paymentMethod || "COD").toUpperCase();
  const paymentStatus = (order?.paymentStatus || "").toUpperCase();

  return (
    status === "PENDING" &&
    paymentMethod === "COD" &&
    paymentStatus !== "PAID"
  );
};

const isPaidVnpayOrder = (order) => {
  const status = normalizeStatus(order?.status);
  const paymentMethod = (order?.paymentMethod || "").toUpperCase();
  const paymentStatus = (order?.paymentStatus || "").toUpperCase();

  return status === "PENDING" && paymentMethod === "VNPAY" && paymentStatus === "PAID";
};

const resolveItemFood = async (item) => {
  if (!item || getRawItemImage(item)) return item;

  const foodId = getFoodId(item);
  if (!foodId) return item;

  try {
    const response = await foodAPI.getFoodById(foodId);
    const food = response?.data || {};

    return {
      ...item,
      resolvedImage: food.imageUrl || food.foodImage || food.image || "",
      resolvedName:
        getItemName(item) === "Món ăn đã đặt" ? food.name : getItemName(item),
    };
  } catch (error) {
    console.warn("Không tải được ảnh món trong đơn hàng:", error);
    return item;
  }
};

function OrderHistoryPage() {
  const navigate = useNavigate();
  const { addToCart, loadCartFromDatabase } = useCart();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [reorderLoadingId, setReorderLoadingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [notice, setNotice] = useState({
  open: false,
  type: "success",
  title: "",
  message: "",
});
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewForm, setReviewForm] = useState({
  orderItemId: "",
  rating: 5,
  comment: "",
});
  const [reviewLoading, setReviewLoading] = useState(false);

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString("vi-VN") : "--";

  const statusMap = {
    ALL: {
      text: "Tất cả",
      icon: "",
    },

    PENDING: {
      text: "Chờ xác nhận",
      color: "yellow",
      icon: "⏱",
    },

    PENDING_PAYMENT: {
      text: "Chờ thanh toán",
      color: "yellow",
      icon: "💳",
    },

    PREPARING: {
      text: "Đang chuẩn bị",
      color: "blue",
      icon: "👨‍🍳",
    },

    DELIVERING: {
      text: "Đang giao",
      color: "purple",
      icon: "🛵",
    },

    COMPLETED: {
      text: "Hoàn thành",
      color: "green",
      icon: "✓",
    },

    CANCELLED: {
      text: "Đã hủy",
      color: "red",
      icon: "✕",
    },

    // Giữ lại để tương thích đơn cũ nếu database từng có status này
    CONFIRMED: {
      text: "Đang chuẩn bị",
      color: "blue",
      icon: "👨‍🍳",
    },

    SHIPPING: {
      text: "Đang giao",
      color: "purple",
      icon: "🛵",
    },
  };

  const tabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "PREPARING", label: "Đang chuẩn bị" },
    { key: "DELIVERING", label: "Đang giao" },
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
      const orderList = Array.isArray(data) ? data : [];

      const resolvedOrders = await Promise.all(
        orderList.map(async (order) => {
          let fullOrder = order;
          let items = getOrderItems(order);

          // API lịch sử thường chỉ trả thông tin tóm tắt.
          // Lấy chi tiết để có danh sách món và ảnh món.
          if (items.length === 0 && order.id) {
            try {
              fullOrder = await getOrderDetail(order.id);
              items = getOrderItems(fullOrder);
            } catch (error) {
              console.warn("Không tải được chi tiết đơn hàng:", error);
            }
          }

          const resolvedItems = await Promise.all(items.map(resolveItemFood));

          return {
            ...order,
            ...fullOrder,
            items: resolvedItems,
          };
        })
      );

      setOrders(resolvedOrders);
    } catch (error) {
      console.error("Lỗi tải lịch sử đơn hàng:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (id) => {
    try {
      const data = await getOrderDetail(id);
      const items = getOrderItems(data);
      const resolvedItems = await Promise.all(items.map(resolveItemFood));

      setSelectedOrder({
        ...data,
        items: resolvedItems,
      });
    } catch (error) {
      console.error("Lỗi xem chi tiết đơn hàng:", error);
    }
  };
  const openReviewModal = async (order) => {
  try {
    let fullOrder = order;
    let items = getOrderItems(order);

    if (items.length === 0 && order.id) {
      fullOrder = await getOrderDetail(order.id);
      items = getOrderItems(fullOrder);
    }

    if (!items || items.length === 0) {
      toast.error("Không tìm thấy món ăn trong đơn hàng này.");
      return;
    }

    setReviewTarget({
      ...order,
      ...fullOrder,
      items,
    });

    setReviewForm({
      orderItemId: String(items[0].id),
      rating: 5,
      comment: "",
    });
  } catch (error) {
    console.error("Lỗi mở đánh giá:", error);
    toast.error("Không thể mở đánh giá đơn hàng.");
  }
};

  const validateReviewBeforeSubmit = (rating, comment) => {
  const text = normalizeReviewText(comment);
  const positiveText = removeNegativePhrases(text);

  const positiveWords = [
    "ngon",
    "rat ngon",
    "tuyet voi",
    "xuat sac",
    "hai long",
    "thich",
    "se mua lai",
    "dang tien",
    "tot",
    "hap dan",
    "vua mieng",
    "de an",
  ];

  const negativeWords = [
    "te",
    "qua te",
    "khong ngon",
    "chua ngon",
    "khong duoc ngon",
    "khong tot",
    "that vong",
    "nguoi",
    "qua man",
    "qua nhat",
    "kho an",
    "kem",
    "khong hai long",
    "chan",
    "hoi",
    "khong dang tien",
  ];

  if (!comment || comment.trim().length < 5) {
    return "Vui lòng nhập nhận xét ít nhất 5 ký tự.";
  }

  if (rating <= 2 && hasKeyword(positiveText, positiveWords)) {
    return "Bạn đang chọn số sao thấp nhưng nội dung lại đang khen món ăn.";
  }

  if (rating >= 4 && hasKeyword(text, negativeWords)) {
    return "Bạn đang chọn số sao cao nhưng nội dung lại đang chê món ăn.";
  }

  return "";
};

const normalizeReviewText = (value) => {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const hasKeyword = (text, words) => {
  const value = ` ${text} `;

  return words.some((word) => {
    const keyword = ` ${normalizeReviewText(word)} `;
    return value.includes(keyword);
  });
};

const removeNegativePhrases = (text) => {
  const negativeWords = [
    "te",
    "qua te",
    "khong ngon",
    "chua ngon",
    "khong duoc ngon",
    "khong tot",
    "that vong",
    "nguoi",
    "qua man",
    "qua nhat",
    "kho an",
    "kem",
    "khong hai long",
    "chan",
    "hoi",
    "khong dang tien",
  ];

  let result = ` ${text} `;

  negativeWords.forEach((word) => {
    result = result.replace(` ${normalizeReviewText(word)} `, " ");
  });

  return result.replace(/\s+/g, " ").trim();
};

const handleSubmitReview = async () => {
  if (!reviewTarget) return;

  const rating = Number(reviewForm.rating);
  const errorMessage = validateReviewBeforeSubmit(
    rating,
    reviewForm.comment
  );

  if (errorMessage) {
    toast.error(errorMessage);
    return;
  }

  try {
    setReviewLoading(true);

    await createReview({
      orderId: reviewTarget.id,
      orderItemId: Number(reviewForm.orderItemId),
      rating,
      comment: reviewForm.comment.trim(),
    });

    toast.success("Đánh giá món ăn thành công!");
    setReviewTarget(null);
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);

    toast.error(
      error?.response?.data?.message || "Không thể gửi đánh giá."
    );
  } finally {
    setReviewLoading(false);
  }
};
  const handleReorder = async (order) => {
  if (!canReorderOrder(order)) {
    showNotice(
      "error",
      "Không thể đặt lại",
      "Chỉ có thể đặt lại đơn hàng đã hoàn thành."
    );
    return;
  }

  try {
    setReorderLoadingId(order.id);

    let fullOrder = order;
    let items = getOrderItems(order);

    if (items.length === 0 && order.id) {
      fullOrder = await getOrderDetail(order.id);
      items = getOrderItems(fullOrder);
    }

    if (!items || items.length === 0) {
      showNotice(
        "error",
        "Không thể đặt lại",
        "Không tìm thấy món ăn trong đơn hàng này."
      );
      return;
    }

    for (const item of items) {
      const foodId = getFoodId(item);
      const quantity = Number(item.quantity || 1);

      if (!foodId) {
        console.warn("Không tìm thấy foodId của món:", item);
        continue;
      }

      await addToCart(
        {
          id: foodId,
          foodItemId: foodId,
          name: getItemName(item),
          imageUrl: getItemImage(item),
          price: item.unitPrice || item.price || 0,
        },
        quantity
      );
    }

    await loadCartFromDatabase();

    navigate("/cart");
  } catch (error) {
    console.error("Lỗi đặt lại đơn hàng:", error);

    showNotice(
      "error",
      "Đặt lại thất bại",
      "Không thể đặt lại đơn hàng. Vui lòng thử lại."
    );
  } finally {
    setReorderLoadingId(null);
  }
};
  const showNotice = (type, title, message) => {
  setNotice({
    open: true,
    type,
    title,
    message,
  });
};

const closeNotice = () => {
  setNotice({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
};
  const handleCancelOrder = (order) => {
  if (!canUserCancelOrder(order)) {
    showNotice(
      "error",
      "Không thể hủy đơn",
      "Chỉ có thể hủy đơn COD khi đơn hàng đang chờ xác nhận."
    );
    return;
  }

  setCancelTarget(order);
};
  const confirmCancelOrder = async () => {
  if (!cancelTarget) return;

  try {
    setCancelLoading(true);

    const updatedOrder = await cancelOrder(
      cancelTarget.id,
      "Khách hàng đã hủy đơn khi đơn hàng đang chờ xác nhận"
    );

    setOrders((prev) =>
      prev.map((item) =>
        item.id === updatedOrder.id
          ? {
              ...item,
              ...updatedOrder,
              items: item.items,
            }
          : item
      )
    );

    if (selectedOrder?.id === updatedOrder.id) {
      setSelectedOrder((prev) => ({
        ...prev,
        ...updatedOrder,
      }));
    }

    setCancelTarget(null);

    showNotice(
      "success",
      "Hủy đơn thành công",
      "Đơn hàng của bạn đã được hủy thành công."
    );
  } catch (error) {
    console.error("Lỗi hủy đơn hàng:", error);

    setCancelTarget(null);

    showNotice(
      "error",
      "Hủy đơn thất bại",
      error?.response?.data?.message || "Không thể hủy đơn hàng."
    );
  } finally {
    setCancelLoading(false);
  }
};

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (activeStatus === "ALL") return orders;

    return orders.filter(
      (order) => normalizeStatus(order.status) === activeStatus
    );
  }, [activeStatus, orders]);

  const getTabCount = (status) => {
    if (status === "ALL") return orders.length;

    return orders.filter((order) => normalizeStatus(order.status) === status)
      .length;
  };

  const getFirstItem = (order) => getOrderItems(order)[0] || null;

  const getItemsCount = (order) => getOrderItems(order).length;

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
                <span className="order-history-kicker">
                  FoodStack Orders
                </span>

                <h1>Lịch sử đơn hàng</h1>

                <p>
                  Theo dõi đơn hàng, trạng thái giao hàng và xem lại các món bạn
                  đã đặt.
                </p>
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
                    className={`history-tab ${
                      activeStatus === tab.key ? "active" : ""
                    }`}
                  >
                    <span className="tab-icon">{status.icon}</span>
                    <span>{tab.label}</span>
                    <b>{getTabCount(tab.key)}</b>
                  </button>
                );
              })}
            </div>

            <div className="order-perks">
              <span>Cập nhật trạng thái rõ ràng</span>
              <span>Theo dõi quá trình giao món</span>
              <span>Liên hệ hỗ trợ nhanh</span>
            </div>
          </div>
        </section>

        <section className="order-history-container order-history-content">
          {loading ? (
            <div className="order-history-empty">
              Đang tải lịch sử đơn hàng...
            </div>
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
                  onCancel={() => handleCancelOrder(order)}
                  onReorder={() => handleReorder(order)}
                  reorderLoading={reorderLoadingId === order.id}
                  onReview={() => openReviewModal(order)}
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
      {cancelTarget && (
  <ConfirmActionModal
    title="Xác nhận hủy đơn"
    message={`Bạn có chắc muốn hủy đơn ${
      cancelTarget.orderCode || `#${cancelTarget.id}`
    } không?`}
    confirmText={cancelLoading ? "Đang hủy..." : "Xác nhận hủy"}
    cancelText="Quay lại"
    loading={cancelLoading}
    onConfirm={confirmCancelOrder}
    onClose={() => !cancelLoading && setCancelTarget(null)}
  />
)}

{notice.open && (
  <NoticeModal
    type={notice.type}
    title={notice.title}
    message={notice.message}
    onClose={closeNotice}
  />
)}
{reviewTarget && (
  <ReviewModal
    order={reviewTarget}
    reviewForm={reviewForm}
    setReviewForm={setReviewForm}
    loading={reviewLoading}
    onSubmit={handleSubmitReview}
    onClose={() => !reviewLoading && setReviewTarget(null)}
  />
)}

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
  onCancel,
  onReorder,
  reorderLoading,
  onReview,
}) {
  const extraItems = Math.max(itemsCount - 1, 0);
  const image = getItemImage(firstItem);
  const name = getItemName(firstItem);
  const quantity = firstItem?.quantity || 1;

  return (
    <article className="order-redesign-card">
      <div className="order-card-head">
        <div className="order-code-block">
          <div className={`status-icon status-${status.color || "gray"}`}>
            {status.icon}
          </div>

          <div>
            <h3>Mã đơn: {order.orderCode || `#${order.id}`}</h3>
            <p>📅 {formatDate(order.createdAt || order.date)}</p>
          </div>
        </div>

        <div className="order-total-block">
          <span className={`status-pill status-${status.color || "gray"}`}>
            {status.text}
          </span>

          <strong>{formatMoney(order.totalAmount || order.total)}</strong>
        </div>
      </div>

      <div className="order-card-body">
        <div className="order-item-preview">
          <div className="order-item-image-wrap">
            <img
              src={image}
              alt={name}
              onError={(event) => {
                event.currentTarget.src = FOOD_PLACEHOLDER;
              }}
            />

            <span>{quantity}</span>
          </div>

          <div className="order-item-info">
            <h4>{name}</h4>
            <p>Số lượng: {quantity}</p>

            {extraItems > 0 && <b>+{extraItems} món khác</b>}

            <div className="order-address">{address}</div>
          </div>
        </div>

        <OrderTimeline
          status={order.status}
          cancelReason={order.cancelReason}
        />

        <div className="order-payment-row">
          <span>Thanh toán: {order.paymentMethod || "--"}</span>
          <span>{order.paymentStatus || "--"}</span>
        </div>

        <div className="order-actions">
  <button
    type="button"
    className="primary-action"
    onClick={onViewDetail}
  >
    Xem chi tiết
  </button>

  {canUserCancelOrder(order) && (
    <button
      type="button"
      className="cancel-order-action"
      onClick={onCancel}
    >
      Hủy đơn
    </button>
  )}

  {isPaidVnpayOrder(order) && (
    <p className="vnpay-cancel-note">
      Đơn đã thanh toán VNPay, vui lòng liên hệ cửa hàng nếu cần hủy/hoàn tiền.
    </p>
  )}

  {canReorderOrder(order) && (
  <button
    type="button"
    className="secondary-action"
    onClick={onReorder}
    disabled={reorderLoading}
  >
    {reorderLoading ? "Đang thêm..." : "Đặt lại"}
  </button>
)}

  {normalizeStatus(order.status) === "COMPLETED" && (
  <button
    type="button"
    className="review-action"
    onClick={onReview}
  >
    Đánh giá
  </button>
)}
</div>
      </div>
    </article>
  );
}

function OrderTimeline({ status, cancelReason }) {
  const steps = [
    { key: "PENDING", label: "Đặt hàng" },
    { key: "PREPARING", label: "Đang chuẩn bị" },
    { key: "DELIVERING", label: "Đang giao" },
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
    return (
      <div className="cancelled-timeline">
        <strong>Đơn hàng đã bị hủy</strong>

        {cancelReason && (
          <p>
            <b>Lý do:</b> {cancelReason}
          </p>
        )}
      </div>
    );
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

function OrderDetailModal({
  order,
  getStatus,
  formatMoney,
  formatDate,
  onClose,
}) {
  const status = getStatus(order.status);
  const items = getOrderItems(order);

  return (
    <div className="order-detail-overlay" onClick={onClose}>
      <div
        className="order-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="order-detail-header">
          <div>
            <span>Chi tiết đơn hàng</span>
            <h2>{order.orderCode || `#${order.id}`}</h2>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
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
            <p>
              <b>Người nhận:</b> {order.shippingName || "--"}
            </p>

            <p>
              <b>SĐT:</b> {order.shippingPhone || "--"}
            </p>

            <p>
              <b>Địa chỉ:</b> {order.shippingAddress || "--"}
            </p>

            <p>
              <b>Ghi chú:</b> {order.note || "Không có"}
            </p>
          </div>

          {order.status === "CANCELLED" && order.cancelReason && (
            <>
              <h3>Lý do hủy đơn</h3>

              <div className="cancel-reason-box">
                <p>{order.cancelReason}</p>
              </div>
            </>
          )}

          <h3>Sản phẩm đã đặt</h3>

          <div className="detail-items">
            {items.map((item, index) => (
              <div className="detail-item" key={item.id || index}>
                <img
                  src={getItemImage(item)}
                  alt={getItemName(item)}
                  onError={(event) => {
                    event.currentTarget.src = FOOD_PLACEHOLDER;
                  }}
                />

                <div>
                  <h4>{getItemName(item)}</h4>
                  <p>Số lượng: {item.quantity}</p>
                  <p>Đơn giá: {formatMoney(item.unitPrice)}</p>
                </div>

                <strong>{formatMoney(item.subtotal)}</strong>
              </div>
            ))}
          </div>

          <div className="total-box">
  {order.voucherCode && (
    <Row label="Mã giảm giá" value={order.voucherCode} />
  )}

  <Row label="Tạm tính" value={formatMoney(order.subtotal)} />

  <Row label="Phí giao hàng" value={formatMoney(order.shippingFee)} />

  {Number(order.discountAmount || 0) > 0 && (
    <Row
      label="Giảm giá voucher"
      value={`-${formatMoney(order.discountAmount)}`}
    />
  )}

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
function ConfirmActionModal({
  title,
  message,
  confirmText,
  cancelText,
  loading,
  onConfirm,
  onClose,
}) {
  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-box"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="custom-modal-icon warning">!</div>

        <h3>{title}</h3>
        <p>{message}</p>

        <div className="custom-modal-actions">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="modal-danger-btn"
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function NoticeModal({ type, title, message, onClose }) {
  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className="custom-modal-box notice"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`custom-modal-icon ${type}`}>
          {type === "success" ? "✓" : "!"}
        </div>

        <h3>{title}</h3>
        <p>{message}</p>

        <div className="custom-modal-actions center">
          <button
            type="button"
            className={type === "success" ? "modal-primary-btn" : "modal-danger-btn"}
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
function ReviewModal({
  order,
  reviewForm,
  setReviewForm,
  loading,
  onSubmit,
  onClose,
}) {
  const items = getOrderItems(order);
  const selectedItem = items.find(
    (item) => String(item.id) === String(reviewForm.orderItemId)
  );

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div
        className="review-modal-box"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="review-modal-header">
          <div>
            <span>Đánh giá món ăn</span>
            <h3>{order.orderCode || `#${order.id}`}</h3>
          </div>

          <button type="button" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <div className="review-modal-body">
          <label>Chọn món cần đánh giá</label>

          <select
            value={reviewForm.orderItemId}
            onChange={(event) =>
              setReviewForm((prev) => ({
                ...prev,
                orderItemId: event.target.value,
              }))
            }
            disabled={loading}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {getItemName(item)} - SL: {item.quantity}
              </option>
            ))}
          </select>

          {selectedItem && (
            <div className="review-food-preview">
              <img
                src={getItemImage(selectedItem)}
                alt={getItemName(selectedItem)}
                onError={(event) => {
                  event.currentTarget.src = FOOD_PLACEHOLDER;
                }}
              />

              <div>
                <strong>{getItemName(selectedItem)}</strong>
                <span>Số lượng: {selectedItem.quantity}</span>
              </div>
            </div>
          )}

          <label>Số sao đánh giá</label>

          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= reviewForm.rating ? "active" : ""}
                onClick={() =>
                  setReviewForm((prev) => ({
                    ...prev,
                    rating: star,
                  }))
                }
                disabled={loading}
              >
                ★
              </button>
            ))}
          </div>

          <div className="review-rating-hint">
            {reviewForm.rating <= 2 &&
              "Bạn đang đánh giá thấp, nội dung nên phản ánh điểm chưa hài lòng."}

            {reviewForm.rating === 3 &&
              "Bạn đang đánh giá trung bình, có thể góp ý cả điểm tốt và điểm cần cải thiện."}

            {reviewForm.rating >= 4 &&
              "Bạn đang đánh giá cao, nội dung nên phù hợp với trải nghiệm tích cực."}
          </div>

          <label>Lời nhắn đánh giá</label>

          <textarea
            rows={4}
            placeholder="Ví dụ: Món ăn ngon, giao nhanh, đóng gói sạch sẽ..."
            value={reviewForm.comment}
            onChange={(event) =>
              setReviewForm((prev) => ({
                ...prev,
                comment: event.target.value,
              }))
            }
            disabled={loading}
          />
        </div>

        <div className="review-modal-actions">
          <button
            type="button"
            className="review-cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>

          <button
            type="button"
            className="review-submit-btn"
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderHistoryPage;