import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminFoodAPI, uploadAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './AdminFoodManagement.css';

const EMPTY_FORM = {
  name: '',
  categoryId: '',
  price: '',
  discountPrice: '',
  description: '',
  imageUrl: '',
  isAvailable: true
};

const AdminFoodManagement = () => {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editFood, setEditFood] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const loadData = async () => {
    try {
      setLoading(true);

      const [foodsRes, categoriesRes] = await Promise.all([
        adminFoodAPI.getFoods(),
        adminFoodAPI.getCategories()
      ]);

      setFoods(Array.isArray(foodsRes.data) ? foodsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được dữ liệu món ăn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchSearch = (food.name || '')
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchCat =
        filterCat === 'Tất cả' || food.categoryName === filterCat;

      return matchSearch && matchCat;
    });
  }, [foods, searchText, filterCat]);

  const resetImageState = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setFileInputKey(Date.now());
  };

  const openAdd = () => {
    setEditFood(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id || ''
    });
    resetImageState();
    setShowModal(true);
  };

  const openEdit = (food) => {
    setEditFood(food);
    setForm({
      name: food.name || '',
      categoryId: food.categoryId || '',
      price: food.price || '',
      discountPrice: food.discountPrice || '',
      description: food.description || '',
      imageUrl: food.imageUrl || '',
      isAvailable: food.isAvailable ?? true
    });

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(food.imageUrl || '');
    setFileInputKey(Date.now());
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditFood(null);
    setForm(EMPTY_FORM);
    resetImageState();
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn đúng file ảnh');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const blobUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setForm((prev) => ({
      ...prev,
      imageUrl: ''
    }));
    setPreviewUrl(blobUrl);
  };

  const handleImageUrlChange = (e) => {
    const value = e.target.value;

    if (selectedFile) {
      setSelectedFile(null);
      setFileInputKey(Date.now());
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm((prev) => ({
      ...prev,
      imageUrl: value
    }));

    setPreviewUrl(value.trim() ? value.trim() : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên món');
      return;
    }

    if (!form.categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      toast.error('Giá món ăn không hợp lệ');
      return;
    }

    if (form.discountPrice && Number(form.discountPrice) < 0) {
      toast.error('Giá khuyến mãi không hợp lệ');
      return;
    }

    if (
      form.discountPrice &&
      Number(form.discountPrice) > Number(form.price)
    ) {
      toast.error('Giá khuyến mãi không được lớn hơn giá gốc');
      return;
    }

    try {
      setSaving(true);

      let finalImageUrl = form.imageUrl?.trim() || '';

      if (selectedFile) {
        setUploadingImage(true);
        const uploadRes = await uploadAPI.uploadImage(selectedFile);
        finalImageUrl = uploadRes.data?.imageUrl || '';
        setUploadingImage(false);
      }

      const payload = {
        name: form.name.trim(),
        categoryId: Number(form.categoryId),
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        description: form.description?.trim() || '',
        imageUrl: finalImageUrl,
        isAvailable: form.isAvailable
      };

      if (editFood) {
        await adminFoodAPI.updateFood(editFood.id, payload);
        toast.success('Cập nhật món ăn thành công');
      } else {
        await adminFoodAPI.createFood(payload);
        toast.success('Thêm món ăn thành công');
      }

      closeModal();
      loadData();
    } catch (err) {
      setUploadingImage(false);
      toast.error(err.response?.data?.message || 'Lưu món ăn thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFoodAPI.deleteFood(id);
      toast.success('Xóa món ăn thành công');
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xóa món ăn thất bại');
    }
  };

  const toggleAvailable = async (id) => {
    try {
      await adminFoodAPI.toggleAvailability(id);
      toast.success('Đã cập nhật trạng thái món ăn');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không cập nhật được trạng thái');
    }
  };

  return (
    <AdminLayout title="🍔 Quản lý món ăn">
      <div className="admin-toolbar card">
        <div className="toolbar-left">
          <input
            placeholder="🔍 Tìm kiếm món ăn..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />

          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            style={{ width: 180 }}
          >
            <option>Tất cả</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={openAdd}>
          ➕ Thêm món mới
        </button>
      </div>

      <div className="food-stats">
        <div className="food-stat-item">
          Tổng số món: <strong>{foods.length}</strong>
        </div>
        <div className="food-stat-item success">
          Đang bán: <strong>{foods.filter((f) => f.isAvailable).length}</strong>
        </div>
        <div className="food-stat-item danger">
          Hết món: <strong>{foods.filter((f) => !f.isAvailable).length}</strong>
        </div>
        <div className="food-stat-item info">
          Kết quả tìm: <strong>{filteredFoods.length}</strong>
        </div>
      </div>

      <div className="card admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TÊN MÓN</th>
                <th>DANH MỤC</th>
                <th>GIÁ</th>
                <th>KHUYẾN MÃI</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>

            <tbody>
              {!loading &&
                filteredFoods.map((food) => (
                  <tr key={food.id}>
                    <td>#{food.id}</td>
                    <td>
                      <strong>{food.name}</strong>
                    </td>
                    <td>{food.categoryName}</td>
                    <td>{Number(food.price || 0).toLocaleString('vi-VN')}đ</td>
                    <td>
                      {food.discountPrice
                        ? `${Number(food.discountPrice).toLocaleString('vi-VN')}đ`
                        : '-'}
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${food.isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => toggleAvailable(food.id)}
                      >
                        {food.isAvailable ? '✅ Còn món' : '❌ Hết món'}
                      </button>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openEdit(food)}
                        >
                          ✏️ Sửa
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(food.id)}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          {!loading && filteredFoods.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="icon">🔍</div>
              <h3>Không tìm thấy món nào</h3>
            </div>
          )}

          {loading && (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <h3>Đang tải dữ liệu...</h3>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editFood ? '✏️ Chỉnh sửa món ăn' : '➕ Thêm món mới'}</h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label>Tên món *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Danh mục *</label>
                  <select
                    name="categoryId"
                    value={form.categoryId}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Giá *</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Giá khuyến mãi</label>
                  <input
                    type="number"
                    name="discountPrice"
                    value={form.discountPrice}
                    onChange={handleFormChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Chọn ảnh từ máy tính</label>
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {form.imageUrl && !selectedFile && (
                  <small style={{ color: '#888' }}>
                    Khi chọn file từ máy, URL ảnh sẽ được xóa tự động.
                  </small>
                )}
              </div>

              {previewUrl && (
                <div className="form-group">
                  <label>Xem trước ảnh</label>
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={previewUrl}
                      alt="preview"
                      style={{
                        width: '160px',
                        height: '160px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Hoặc nhập URL ảnh</label>
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleImageUrlChange}
                  placeholder="https://example.com/image.jpg"
                  disabled={!!selectedFile}
                />
                {selectedFile && (
                  <small style={{ color: '#888' }}>
                    Bạn đang dùng ảnh từ máy tính, nên ô URL đã được khóa.
                  </small>
                )}
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={form.isAvailable}
                  onChange={handleFormChange}
                />
                Đang bán
              </label>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={closeModal}
                  disabled={saving || uploadingImage}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || uploadingImage}
                >
                  {uploadingImage
                    ? '⏳ Đang upload ảnh...'
                    : saving
                    ? '⏳ Đang lưu...'
                    : editFood
                    ? '💾 Lưu thay đổi'
                    : '➕ Thêm món'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div
            className="modal-box card confirm-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3>Xác nhận xóa món ăn?</h3>
              <p style={{ color: '#888', margin: '12px 0 24px' }}>
                Hành động này không thể hoàn tác!
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center'
                }}
              >
                <button
                  className="btn btn-outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Hủy
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFoodManagement;