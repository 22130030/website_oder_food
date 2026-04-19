import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import './AdminFoodManagement.css';

const CATEGORIES = ['Món chính', 'Đồ uống', 'Ăn nhẹ', 'Lẩu', 'Pizza', 'Tráng miệng'];

const INITIAL_FOODS = [
  { id: 1, name: 'Phở Bò Đặc Biệt', category: 'Món chính', price: 75000, available: true, stock: 50 },
  { id: 2, name: 'Cơm Tấm Sườn Nướng', category: 'Món chính', price: 65000, available: true, stock: 40 },
  { id: 3, name: 'Trà Sữa Trân Châu', category: 'Đồ uống', price: 35000, available: true, stock: 100 },
  { id: 4, name: 'Bánh Mì Thịt Nướng', category: 'Ăn nhẹ', price: 25000, available: false, stock: 0 },
  { id: 5, name: 'Lẩu Thái Hải Sản', category: 'Lẩu', price: 280000, available: true, stock: 20 },
  { id: 6, name: 'Pizza Hải Sản', category: 'Pizza', price: 185000, available: true, stock: 15 },
];

const EMPTY_FORM = { name: '', category: 'Món chính', price: '', description: '', imageUrl: '', available: true, stock: 0 };

const AdminFoodManagement = () => {
  const [foods, setFoods] = useState(INITIAL_FOODS);
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [showModal, setShowModal] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = foods.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = filterCat === 'Tất cả' || f.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setEditFood(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (food) => { setEditFood(food); setForm({ ...food }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditFood(null); setForm(EMPTY_FORM); };

  const handleFormChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editFood) {
      setFoods(prev => prev.map(f => f.id === editFood.id ? { ...f, ...form, price: +form.price, stock: +form.stock } : f));
    } else {
      const newFood = { ...form, id: Date.now(), price: +form.price, stock: +form.stock };
      setFoods(prev => [newFood, ...prev]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setFoods(prev => prev.filter(f => f.id !== id));
    setDeleteConfirm(null);
  };

  const toggleAvailable = (id) => {
    setFoods(prev => prev.map(f => f.id === id ? { ...f, available: !f.available } : f));
  };

  return (
    <AdminLayout title="🍔 Quản lý món ăn">
      {/* Toolbar */}
      <div className="admin-toolbar card">
        <div className="toolbar-left">
          <input placeholder="🔍 Tìm kiếm món ăn..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 260 }} />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ width: 160 }}>
            <option>Tất cả</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Thêm món mới</button>
      </div>

      {/* Stats Row */}
      <div className="food-stats">
        <div className="food-stat-item">Tổng số món: <strong>{foods.length}</strong></div>
        <div className="food-stat-item success">Đang bán: <strong>{foods.filter(f => f.available).length}</strong></div>
        <div className="food-stat-item danger">Hết món: <strong>{foods.filter(f => !f.available).length}</strong></div>
        <div className="food-stat-item info">Kết quả tìm: <strong>{filtered.length}</strong></div>
      </div>

      {/* Table */}
      <div className="card admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên món</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(food => (
                <tr key={food.id}>
                  <td className="text-muted">#{food.id}</td>
                  <td><strong>{food.name}</strong></td>
                  <td><span className="badge badge-info">{food.category}</span></td>
                  <td><strong>{food.price.toLocaleString('vi-VN')}đ</strong></td>
                  <td>{food.stock}</td>
                  <td>
                    <button
                      className={`toggle-btn ${food.available ? 'available' : 'unavailable'}`}
                      onClick={() => toggleAvailable(food.id)}
                    >
                      {food.available ? '✅ Còn món' : '❌ Hết món'}
                    </button>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(food)}>✏️ Sửa</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(food.id)}>🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="icon">🔍</div>
              <h3>Không tìm thấy món nào</h3>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editFood ? '✏️ Chỉnh sửa món ăn' : '➕ Thêm món mới'}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label>Tên món *</label>
                  <input name="name" value={form.name} onChange={handleFormChange} required placeholder="Phở Bò Đặc Biệt" />
                </div>
                <div className="form-group">
                  <label>Danh mục *</label>
                  <select name="category" value={form.category} onChange={handleFormChange}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá (VNĐ) *</label>
                  <input type="number" name="price" value={form.price} onChange={handleFormChange} required placeholder="75000" min="0" />
                </div>
                <div className="form-group">
                  <label>Tồn kho</label>
                  <input type="number" name="stock" value={form.stock} onChange={handleFormChange} min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Mô tả món ăn..." />
              </div>
              <div className="form-group">
                <label>URL hình ảnh</label>
                <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} placeholder="https://..." />
              </div>
              <label className="checkbox-label">
                <input type="checkbox" name="available" checked={form.available} onChange={handleFormChange} />
                Đang bán (Còn món)
              </label>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editFood ? '💾 Lưu thay đổi' : '➕ Thêm món'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box card confirm-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3>Xác nhận xóa món ăn?</h3>
              <p style={{ color: '#888', margin: '12px 0 24px' }}>Hành động này không thể hoàn tác!</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Hủy</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>🗑️ Xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFoodManagement;
