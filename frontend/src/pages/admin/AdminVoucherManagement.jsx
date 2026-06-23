import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminVoucherAPI } from '../../services/api';
import './AdminVoucherManagement.css';

const emptyForm = {
  code: '',
  name: '',
  description: '',
  discountType: 'PERCENT',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  quantity: '',
  active: true,
  startDate: '',
  endDate: '',
};

const toDateTimeLocal = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
};

const toServerDateTime = (value) => {
  if (!value) return null;

  return value.length === 16 ? `${value}:00` : value;
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
};

const formatDateTime = (value) => {
  if (!value) return '--';

  return new Date(value).toLocaleString('vi-VN');
};

const getStatusClass = (status) => {
  if (status === 'Đang hoạt động') return 'status-active';
  if (status === 'Sắp diễn ra') return 'status-upcoming';
  if (status === 'Tạm tắt') return 'status-off';
  if (status === 'Hết lượt') return 'status-used';
  if (status === 'Hết hạn') return 'status-expired';

  return 'status-off';
};

const AdminVoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadVouchers = async () => {
    try {
      setLoading(true);

      const res = await adminVoucherAPI.getVouchers({
        keyword,
      });

      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi tải voucher:', error);
      toast.error(
        error?.response?.data?.message || 'Không tải được danh sách voucher'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
  }, []);

  const filteredVouchers = useMemo(() => {
    if (statusFilter === 'ALL') return vouchers;

    return vouchers.filter((voucher) => voucher.displayStatus === statusFilter);
  }, [vouchers, statusFilter]);

  const statusCounts = useMemo(() => {
    const result = {
      ALL: vouchers.length,
    };

    vouchers.forEach((voucher) => {
      const key = voucher.displayStatus || 'Không rõ';
      result[key] = (result[key] || 0) + 1;
    });

    return result;
  }, [vouchers]);

  const openCreateModal = () => {
    setEditingVoucher(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (voucher) => {
    setEditingVoucher(voucher);

    setForm({
      code: voucher.code || '',
      name: voucher.name || '',
      description: voucher.description || '',
      discountType: voucher.discountType || 'PERCENT',
      discountValue: voucher.discountValue || '',
      maxDiscountAmount: voucher.maxDiscountAmount || '',
      minOrderAmount: voucher.minOrderAmount || '',
      quantity: voucher.quantity || '',
      active: voucher.active !== false,
      startDate: toDateTimeLocal(voucher.startDate),
      endDate: toDateTimeLocal(voucher.endDate),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingVoucher(null);
    setForm(emptyForm);
  };

  const handleFormChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    return {
      code: form.code,
      name: form.name,
      description: form.description,
      discountType: form.discountType,
      discountValue: Number(form.discountValue || 0),
      maxDiscountAmount: Number(form.maxDiscountAmount || 0),
      minOrderAmount: Number(form.minOrderAmount || 0),
      quantity: Number(form.quantity || 0),
      active: form.active,
      startDate: toServerDateTime(form.startDate),
      endDate: toServerDateTime(form.endDate),
    };
  };

  const saveVoucher = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);

      const payload = buildPayload();

      if (editingVoucher) {
        await adminVoucherAPI.updateVoucher(editingVoucher.id, payload);
        toast.success('Cập nhật voucher thành công!');
      } else {
        await adminVoucherAPI.createVoucher(payload);
        toast.success('Tạo voucher thành công!');
      }

      closeModal();
      await loadVouchers();
    } catch (error) {
      console.error('Lỗi lưu voucher:', error);
      toast.error(error?.response?.data?.message || 'Không thể lưu voucher');
    } finally {
      setSaving(false);
    }
  };

  const toggleVoucher = async (voucher) => {
    try {
      await adminVoucherAPI.toggleVoucher(voucher.id);
      toast.success(
        voucher.active ? 'Đã tạm tắt voucher' : 'Đã bật voucher'
      );

      await loadVouchers();
    } catch (error) {
      console.error('Lỗi bật/tắt voucher:', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật voucher');
    }
  };

  const deleteVoucher = async (voucher) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa voucher ${voucher.code} không?`
    );

    if (!ok) return;

    try {
      const res = await adminVoucherAPI.deleteVoucher(voucher.id);

      toast.success(res?.data?.message || 'Xóa voucher thành công!');
      await loadVouchers();
    } catch (error) {
      console.error('Lỗi xóa voucher:', error);
      toast.error(error?.response?.data?.message || 'Không thể xóa voucher');
    }
  };

  const getDiscountText = (voucher) => {
    if (voucher.discountType === 'PERCENT') {
      return `${Number(voucher.discountValue || 0)}%`;
    }

    return formatMoney(voucher.discountValue);
  };

  return (
    <AdminLayout title="Quản lý voucher">
      <div className="admin-voucher-page">
        <div className="voucher-summary-grid">
          <div className="voucher-summary-card card">
            <span>Tổng voucher</span>
            <strong>{vouchers.length}</strong>
          </div>

          <div className="voucher-summary-card card">
            <span>Đang hoạt động</span>
            <strong>{statusCounts['Đang hoạt động'] || 0}</strong>
          </div>

          <div className="voucher-summary-card card">
            <span>Sắp diễn ra</span>
            <strong>{statusCounts['Sắp diễn ra'] || 0}</strong>
          </div>

          <div className="voucher-summary-card card">
            <span>Tạm tắt / Hết hạn</span>
            <strong>
              {(statusCounts['Tạm tắt'] || 0) +
                (statusCounts['Hết hạn'] || 0)}
            </strong>
          </div>
        </div>

        <div className="card voucher-toolbar">
          <div className="voucher-filter-tabs">
            {[
              'ALL',
              'Đang hoạt động',
              'Sắp diễn ra',
              'Tạm tắt',
              'Hết hạn',
              'Hết lượt',
            ].map((status) => (
              <button
                key={status}
                type="button"
                className={`voucher-filter-btn ${
                  statusFilter === status ? 'active' : ''
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'ALL' ? 'Tất cả' : status}
                <span>{statusCounts[status] || 0}</span>
              </button>
            ))}
          </div>

          <div className="voucher-search-row">
            <input
              placeholder="🔍 Tìm mã voucher, tên voucher..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  loadVouchers();
                }
              }}
            />

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadVouchers}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Tìm kiếm'}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openCreateModal}
            >
              + Thêm voucher
            </button>
          </div>
        </div>

        <div className="card voucher-table-card">
          <div className="admin-table-wrapper">
            <table className="admin-table voucher-table">
              <thead>
                <tr>
                  <th>Mã voucher</th>
                  <th>Thông tin</th>
                  <th>Giảm giá</th>
                  <th>Điều kiện</th>
                  <th>Số lượng</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td>
                      <div className="voucher-code">{voucher.code}</div>
                    </td>

                    <td>
                      <strong>{voucher.name}</strong>
                      <p className="voucher-desc">
                        {voucher.description || 'Không có mô tả'}
                      </p>
                    </td>

                    <td>
                      <strong className="voucher-discount">
                        {getDiscountText(voucher)}
                      </strong>

                      {voucher.discountType === 'PERCENT' && (
                        <p className="voucher-desc">
                          Tối đa: {formatMoney(voucher.maxDiscountAmount)}
                        </p>
                      )}
                    </td>

                    <td>
                      <span>
                        Đơn từ {formatMoney(voucher.minOrderAmount)}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {voucher.remainingQuantity}/{voucher.quantity}
                      </strong>
                      <p className="voucher-desc">
                        Đã dùng: {voucher.usedCount || 0}
                      </p>
                    </td>

                    <td>
                      <p className="voucher-time">
                        Từ: {formatDateTime(voucher.startDate)}
                      </p>
                      <p className="voucher-time">
                        Đến: {formatDateTime(voucher.endDate)}
                      </p>
                    </td>

                    <td>
                      <span
                        className={`voucher-status ${getStatusClass(
                          voucher.displayStatus
                        )}`}
                      >
                        {voucher.displayStatus}
                      </span>
                    </td>

                    <td>
                      <div className="voucher-actions">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditModal(voucher)}
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${
                            voucher.active ? 'btn-warning' : 'btn-success'
                          }`}
                          onClick={() => toggleVoucher(voucher)}
                        >
                          {voucher.active ? 'Tắt' : 'Bật'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteVoucher(voucher)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredVouchers.length === 0 && (
              <div className="voucher-empty">
                <div>🎟️</div>
                <h3>Chưa có voucher nào</h3>
                <p>Hãy tạo voucher đầu tiên cho cửa hàng.</p>
              </div>
            )}
          </div>
        </div>

        {modalOpen && (
          <div className="voucher-modal-overlay" onClick={closeModal}>
            <div
              className="voucher-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="voucher-modal-header">
                <div>
                  <span>Voucher</span>
                  <h3>
                    {editingVoucher ? 'Cập nhật voucher' : 'Thêm voucher mới'}
                  </h3>
                </div>

                <button type="button" onClick={closeModal} disabled={saving}>
                  ×
                </button>
              </div>

              <form className="voucher-form" onSubmit={saveVoucher}>
                <div className="voucher-form-grid">
                  <div className="form-group">
                    <label>Mã voucher</label>
                    <input
                      value={form.code}
                      onChange={(event) =>
                        handleFormChange('code', event.target.value)
                      }
                      placeholder="VD: BOSANH20"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Tên voucher</label>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        handleFormChange('name', event.target.value)
                      }
                      placeholder="VD: Giảm 20% toàn đơn"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group full">
                    <label>Mô tả</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(event) =>
                        handleFormChange('description', event.target.value)
                      }
                      placeholder="Mô tả ngắn về voucher..."
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Loại giảm giá</label>
                    <select
                      value={form.discountType}
                      onChange={(event) =>
                        handleFormChange('discountType', event.target.value)
                      }
                      disabled={saving}
                    >
                      <option value="PERCENT">Giảm theo %</option>
                      <option value="FIXED">Giảm tiền cố định</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      {form.discountType === 'PERCENT'
                        ? 'Phần trăm giảm'
                        : 'Số tiền giảm'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.discountValue}
                      onChange={(event) =>
                        handleFormChange('discountValue', event.target.value)
                      }
                      placeholder={
                        form.discountType === 'PERCENT' ? 'VD: 20' : 'VD: 50000'
                      }
                      disabled={saving}
                    />
                  </div>

                  {form.discountType === 'PERCENT' && (
                    <div className="form-group">
                      <label>Giảm tối đa</label>
                      <input
                        type="number"
                        min="0"
                        value={form.maxDiscountAmount}
                        onChange={(event) =>
                          handleFormChange(
                            'maxDiscountAmount',
                            event.target.value
                          )
                        }
                        placeholder="VD: 50000"
                        disabled={saving}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Đơn tối thiểu</label>
                    <input
                      type="number"
                      min="0"
                      value={form.minOrderAmount}
                      onChange={(event) =>
                        handleFormChange('minOrderAmount', event.target.value)
                      }
                      placeholder="VD: 100000"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(event) =>
                        handleFormChange('quantity', event.target.value)
                      }
                      placeholder="VD: 100"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) =>
                        handleFormChange('startDate', event.target.value)
                      }
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) =>
                        handleFormChange('endDate', event.target.value)
                      }
                      disabled={saving}
                    />
                  </div>

                  <label className="voucher-checkbox full">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(event) =>
                        handleFormChange('active', event.target.checked)
                      }
                      disabled={saving}
                    />
                    <span>Voucher đang được bật</span>
                  </label>
                </div>

                <div className="voucher-modal-actions">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? 'Đang lưu...'
                      : editingVoucher
                      ? 'Cập nhật'
                      : 'Tạo voucher'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVoucherManagement;