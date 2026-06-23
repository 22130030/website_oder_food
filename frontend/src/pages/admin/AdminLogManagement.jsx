import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminLogAPI } from '../../services/api';
import './AdminLogManagement.css';

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'Tất cả hành động' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'TOGGLE', label: 'TOGGLE' },
];

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'Tất cả đối tượng' },
  { value: 'USER', label: 'USER' },
  { value: 'USER_ROLE', label: 'USER_ROLE' },
  { value: 'USER_STATUS', label: 'USER_STATUS' },
  { value: 'FOOD', label: 'FOOD' },
  { value: 'VOUCHER', label: 'VOUCHER' },
  { value: 'ORDER', label: 'ORDER' },
];

const formatDateTime = (value) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('vi-VN', {
    hour12: false,
  });
};

const getActionLabel = (action) => {
  if (action === 'CREATE') return 'Tạo mới';
  if (action === 'UPDATE') return 'Cập nhật';
  if (action === 'DELETE') return 'Xóa';
  if (action === 'TOGGLE') return 'Bật/Tắt';

  return action || '-';
};

const getTargetLabel = (target) => {
  if (target === 'USER') return 'Người dùng';
  if (target === 'USER_ROLE') return 'Phân quyền';
  if (target === 'USER_STATUS') return 'Trạng thái user';
  if (target === 'FOOD') return 'Món ăn';
  if (target === 'VOUCHER') return 'Voucher';
  if (target === 'ORDER') return 'Đơn hàng';

  return target || '-';
};

const prettyJson = (value) => {
  if (!value) return 'Không có dữ liệu';

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch (error) {
    return value;
  }
};

const AdminLogManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [actionFilter, setActionFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');

  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    try {
      setLoading(true);

      const res = await adminLogAPI.getLogs({
        action: actionFilter,
        target: targetFilter,
      });

      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi tải nhật ký:', err);
      toast.error(err.response?.data?.message || 'Không tải được nhật ký hoạt động');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const summary = useMemo(() => {
    return {
      total: logs.length,
      update: logs.filter((log) => log.action === 'UPDATE').length,
      toggle: logs.filter((log) => log.action === 'TOGGLE').length,
      delete: logs.filter((log) => log.action === 'DELETE').length,
    };
  }, [logs]);

  return (
    <AdminLayout title="Nhật ký hoạt động">
      <div className="admin-log-page">
        <div className="log-summary-grid">
          <div className="log-summary-card card">
            <span>Tổng log</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="log-summary-card card">
            <span>Cập nhật</span>
            <strong>{summary.update}</strong>
          </div>

          <div className="log-summary-card card">
            <span>Bật / Tắt</span>
            <strong>{summary.toggle}</strong>
          </div>

          <div className="log-summary-card card">
            <span>Xóa</span>
            <strong>{summary.delete}</strong>
          </div>
        </div>

        <div className="admin-toolbar card log-toolbar">
          <div className="toolbar-left">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              {ACTION_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
            >
              {TARGET_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={loadLogs}>
            Lọc nhật ký
          </button>
        </div>

        <div className="card admin-table-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>THỜI GIAN</th>
                  <th>ADMIN</th>
                  <th>HÀNH ĐỘNG</th>
                  <th>ĐỐI TƯỢNG</th>
                  <th>CHI TIẾT</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="log-empty">
                      Đang tải nhật ký...
                    </td>
                  </tr>
                )}

                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan="6" className="log-empty">
                      Chưa có nhật ký hoạt động.
                    </td>
                  </tr>
                )}

                {!loading &&
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>#{log.id}</td>

                      <td>{formatDateTime(log.createdAt)}</td>

                      <td>
                        <strong>{log.adminName || 'Không rõ'}</strong>
                        <p className="log-subtext">
                          {log.adminEmail || `Admin ID: ${log.adminId || '-'}`}
                        </p>
                      </td>

                      <td>
                        <span className={`log-badge action-${String(log.action || '').toLowerCase()}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>

                      <td>
                        <span className="log-target">
                          {getTargetLabel(log.target)}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedLog && (
          <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="log-modal card" onClick={(e) => e.stopPropagation()}>
              <div className="log-modal-header">
                <div>
                  <span>Nhật ký #{selectedLog.id}</span>
                  <h2>{getActionLabel(selectedLog.action)} - {getTargetLabel(selectedLog.target)}</h2>
                </div>

                <button
                  className="log-modal-close"
                  onClick={() => setSelectedLog(null)}
                >
                  ×
                </button>
              </div>

              <div className="log-detail-grid">
                <div>
                  <label>Thời gian</label>
                  <p>{formatDateTime(selectedLog.createdAt)}</p>
                </div>

                <div>
                  <label>Admin</label>
                  <p>{selectedLog.adminName || selectedLog.adminEmail || '-'}</p>
                </div>

                <div>
                  <label>Hành động</label>
                  <p>{selectedLog.action}</p>
                </div>

                <div>
                  <label>Đối tượng</label>
                  <p>{selectedLog.target}</p>
                </div>
              </div>

              <h3>Dữ liệu thay đổi</h3>

              <pre className="log-json-box">
                {prettyJson(selectedLog.newData)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLogManagement;