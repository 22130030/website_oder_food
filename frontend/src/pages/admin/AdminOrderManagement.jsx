import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import AdminLayout from '../../components/admin/AdminLayout';
import { adminOrderAPI } from '../../services/api';

import './AdminOrderManagement.css';

const ORDER_STATUSES = [
  'PENDING',
  'PREPARING',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_MAP = {
  PENDING: {
    label: 'Chờ xác nhận',
    badge: 'badge-warning',
    icon: '',
  },
  PREPARING: {
    label: 'Đang chuẩn bị',
    badge: 'badge-info',
    icon: '',
  },
  DELIVERING: {
    label: 'Đang giao',
    badge: 'badge-secondary',
    icon: '',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    badge: 'badge-success',
    icon: '',
  },
  CANCELLED: {
    label: 'Đã hủy',
    badge: 'badge-danger',
    icon: '',
  },
};

const PAYMENT_STATUS_MAP = {
  PAID: {
    label: 'Đã thanh toán',
    badge: 'badge-success',
  },
  UNPAID: {
    label: 'Chưa thanh toán',
    badge: 'badge-warning',
  },
  PENDING: {
    label: 'Đang chờ',
    badge: 'badge-warning',
  },
  FAILED: {
    label: 'Thất bại',
    badge: 'badge-danger',
  },
};
const NEXT_STATUS = {
  PENDING: 'PREPARING',
  PREPARING: 'DELIVERING',
  DELIVERING: 'COMPLETED',
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
};

const formatDateTime = (value) => {
  if (!value) return '---';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};

const getStatusInfo = (status) => {
  return STATUS_MAP[status] || {
    label: status || 'Không rõ',
    badge: 'badge-secondary',
    icon: '•',
  };
};

const getPaymentStatusInfo = (status) => {
  return PAYMENT_STATUS_MAP[status] || {
    label: status || 'Không rõ',
    badge: 'badge-secondary',
  };
};

const AdminOrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);

    try {
      const res = await adminOrderAPI.getOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi tải đơn hàng admin:', error);
      toast.error(
        error?.response?.data?.message ||
          'Không tải được danh sách đơn hàng!'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const counts = useMemo(() => {
    const result = {
      ALL: orders.length,
    };

    ORDER_STATUSES.forEach((status) => {
      result[status] = orders.filter((order) => order.status === status).length;
    });

    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchTab = activeTab === 'ALL' || order.status === activeTab;

      const text = [
        order.id,
        order.orderCode,
        order.shippingName,
        order.shippingPhone,
        order.shippingAddress,
        order.paymentMethod,
        order.paymentStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchSearch = !keyword || text.includes(keyword);

      return matchTab && matchSearch;
    });
  }, [orders, activeTab, search]);

  const openDetail = async (orderId) => {
    setDetailLoading(true);

    try {
      const res = await adminOrderAPI.getOrderById(orderId);
      setDetailOrder(res.data);
    } catch (error) {
      console.error('Lỗi xem chi tiết đơn:', error);
      toast.error(
        error?.response?.data?.message ||
          'Không xem được chi tiết đơn hàng!'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const replaceOrderInList = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === updatedOrder.id
          ? {
              ...order,
              ...updatedOrder,
              items: order.items,
            }
          : order
      )
    );
  };

  const updateStatus = async (order, status) => {
    if (!order?.id) return;

    let cancelReason = '';

    if (status === 'CANCELLED') {
      cancelReason = window.prompt(
        'Nhập lý do hủy đơn:',
        order.cancelReason || 'Admin đã hủy đơn hàng'
      );

      if (cancelReason === null) {
        return;
      }
    }

    setUpdatingId(order.id);

    try {
      const res = await adminOrderAPI.updateStatus(
        order.id,
        status,
        cancelReason
      );

      const updatedOrder = res.data;

      replaceOrderInList(updatedOrder);

      if (detailOrder?.id === order.id) {
        setDetailOrder(updatedOrder);
      }

      toast.success('Cập nhật trạng thái đơn hàng thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);

      toast.error(
        error?.response?.data?.message ||
          'Cập nhật trạng thái đơn hàng thất bại!'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const renderStatusBadge = (status) => {
    const st = getStatusInfo(status);

    return (
      <span className={`badge ${st.badge}`}>
        {st.icon} {st.label}
      </span>
    );
  };

  const renderPaymentBadge = (status) => {
    const st = getPaymentStatusInfo(status);

    return (
      <span className={`badge ${st.badge}`}>
        {st.label}
      </span>
    );
  };

  return (
    <AdminLayout title="Quản lý đơn hàng">
      <div className="admin-order-page">
        <div className="order-stat-grid">
          <div className="order-stat-card card">
            <span>Tổng đơn</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="order-stat-card card">
            <span>Chờ xử lý</span>
            <strong>
              <strong>{counts.PENDING || 0}</strong>
            </strong>
          </div>

          <div className="order-stat-card card">
            <span>Đang giao</span>
            <strong>{counts.DELIVERING || 0}</strong>
          </div>

          <div className="order-stat-card card">
            <span>Hoàn thành</span>
            <strong>{counts.COMPLETED || 0}</strong>
          </div>
        </div>

        <div className="admin-order-toolbar card">
          <div className="order-tabs">
            {['ALL', ...ORDER_STATUSES].map((tab) => {
              const statusInfo = getStatusInfo(tab);

              return (
                <button
                  key={tab}
                  type="button"
                  className={`order-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'ALL'
                    ? 'Tất cả'
                    : `${statusInfo.icon} ${statusInfo.label}`}

                  <span>{counts[tab] || 0}</span>
                </button>
              );
            })}
          </div>

          <div className="order-search-row">
            <input
              placeholder="🔍 Tìm mã đơn, tên khách, SĐT, địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadOrders}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
        </div>

        <div
          className={`order-content-grid ${
            detailOrder ? 'has-detail' : ''
          }`}
        >
          <div className="card admin-table-card order-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table order-admin-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Thanh toán</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày đặt</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const next = NEXT_STATUS[order.status];

                    return (
                      <tr key={order.id}>
                        <td>
                          <strong className="order-code">
                            #{order.orderCode || order.id}
                          </strong>
                          <div className="order-id-muted">
                            ID: {order.id}
                          </div>
                        </td>

                        <td>
                          <strong>{order.shippingName || 'Khách hàng'}</strong>
                          <div className="order-customer-sub">
                            {order.shippingPhone || 'Chưa có SĐT'}
                          </div>
                          <div className="order-address-line">
                            {order.shippingAddress || 'Chưa có địa chỉ'}
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-secondary">
                            {order.paymentMethod || 'COD'}
                          </span>
                          <div className="payment-status-line">
                            {renderPaymentBadge(order.paymentStatus)}
                          </div>
                        </td>

                        <td>
                          <strong className="order-total">
                            {formatMoney(order.totalAmount)}
                          </strong>
                          <div className="order-customer-sub">
                            Ship: {formatMoney(order.shippingFee)}
                          </div>
                        </td>

                        <td>
                          {renderStatusBadge(order.status)}
                        </td>

                        <td className="text-muted order-date-cell">
                          {formatDateTime(order.createdAt)}
                        </td>

                        <td>
                          <div className="order-action-btns">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => openDetail(order.id)}
                              disabled={detailLoading}
                            >
                              Chi tiết
                            </button>

                            {next && (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => updateStatus(order, next)}
                                disabled={updatingId === order.id}
                              >
                                {getStatusInfo(next).label}
                              </button>
                            )}

                            {!['COMPLETED', 'CANCELLED'].includes(
                              order.status
                            ) && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() =>
                                  updateStatus(order, 'CANCELLED')
                                }
                                disabled={updatingId === order.id}
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loading && (
                <div className="order-empty-state">
                  <div className="icon">⏳</div>
                  <h3>Đang tải đơn hàng...</h3>
                </div>
              )}

              {!loading && filteredOrders.length === 0 && (
                <div className="order-empty-state">
                  <div className="icon">📦</div>
                  <h3>Không có đơn hàng nào</h3>
                  <p>Thử đổi bộ lọc hoặc nhập từ khóa khác.</p>
                </div>
              )}
            </div>
          </div>

          {detailOrder && (
            <aside className="card order-detail-panel">
              <div className="order-detail-header">
                <div>
                  <span>Chi tiết đơn hàng</span>
                  <h3>#{detailOrder.orderCode || detailOrder.id}</h3>
                </div>

                <button
                  type="button"
                  className="order-detail-close"
                  onClick={() => setDetailOrder(null)}
                >
                  ✕
                </button>
              </div>

              <div className="detail-status-row">
                {renderStatusBadge(detailOrder.status)}
                {renderPaymentBadge(detailOrder.paymentStatus)}
              </div>

              <div className="detail-section">
                <h4>Thông tin khách hàng</h4>

                <div className="detail-line">
                  <span>Người nhận</span>
                  <strong>{detailOrder.shippingName || '---'}</strong>
                </div>

                <div className="detail-line">
                  <span>Số điện thoại</span>
                  <strong>{detailOrder.shippingPhone || '---'}</strong>
                </div>

                <div className="detail-line">
                  <span>Email tài khoản</span>
                  <strong>{detailOrder.customerEmail || '---'}</strong>
                </div>

                <div className="detail-line detail-line-block">
                  <span>Địa chỉ giao hàng</span>
                  <strong>{detailOrder.shippingAddress || '---'}</strong>
                </div>

                {detailOrder.shippingDistanceKm && (
                  <div className="detail-line">
                    <span>Khoảng cách</span>
                    <strong>{detailOrder.shippingDistanceKm} km</strong>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <h4>Món trong đơn</h4>

                <div className="detail-items">
                  {(detailOrder.items || []).map((item) => (
                    <div key={item.id} className="detail-item">
                      <div>
                        <strong>
                          {item.quantity}x {item.foodName}
                        </strong>
                        <span>
                          {formatMoney(item.unitPrice)}
                          {item.note ? ` • ${item.note}` : ''}
                        </span>
                      </div>

                      <b>{formatMoney(item.subtotal)}</b>
                    </div>
                  ))}

                  {(!detailOrder.items || detailOrder.items.length === 0) && (
                    <p className="detail-empty-text">
                      Chưa tải được món trong đơn.
                    </p>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h4>Thanh toán</h4>

                <div className="detail-line">
  <span>Phương thức</span>
  <strong>{detailOrder.paymentMethod || 'COD'}</strong>
</div>

{detailOrder.voucherCode && (
  <div className="detail-line voucher-line">
    <span>Mã giảm giá</span>
    <strong>{detailOrder.voucherCode}</strong>
  </div>
)}

<div className="detail-line">
  <span>Tạm tính</span>
  <strong>{formatMoney(detailOrder.subtotal)}</strong>
</div>

<div className="detail-line">
  <span>Phí giao hàng</span>
  <strong>{formatMoney(detailOrder.shippingFee)}</strong>
</div>

{Number(detailOrder.discountAmount || 0) > 0 && (
  <div className="detail-line discount-line">
    <span>Giảm giá voucher</span>
    <strong>-{formatMoney(detailOrder.discountAmount)}</strong>
  </div>
)}

<div className="detail-line detail-total">
  <span>Tổng cộng</span>
  <strong>{formatMoney(detailOrder.totalAmount)}</strong>
</div>
              </div>

              {detailOrder.note && (
                <div className="detail-section">
                  <h4>Ghi chú</h4>
                  <p className="detail-note">{detailOrder.note}</p>
                </div>
              )}

              {detailOrder.cancelReason && (
                <div className="detail-section cancel-section">
                  <h4>Lý do hủy</h4>
                  <p>{detailOrder.cancelReason}</p>
                </div>
              )}

              <div className="detail-actions">
                {NEXT_STATUS[detailOrder.status] && (
                  <button
                    type="button"
                    className="btn btn-primary btn-full"
                    onClick={() =>
                      updateStatus(
                        detailOrder,
                        NEXT_STATUS[detailOrder.status]
                      )
                    }
                    disabled={updatingId === detailOrder.id}
                  >
                    Chuyển sang:{' '}
                    {getStatusInfo(NEXT_STATUS[detailOrder.status]).label}
                  </button>
                )}

                {!['COMPLETED', 'CANCELLED'].includes(detailOrder.status) && (
                  <button
                    type="button"
                    className="btn btn-danger btn-full"
                    onClick={() => updateStatus(detailOrder, 'CANCELLED')}
                    disabled={updatingId === detailOrder.id}
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrderManagement;