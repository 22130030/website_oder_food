import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { foodAPI } from '../../services/api';
import './MenuPage.css';

const MenuPage = () => {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);

  const [keyword, setKeyword] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sort, setSort] = useState('default');
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  const [loading, setLoading] = useState(false);

  const normalizeCategory = (category) => ({
    id: category.id ?? category.categoryId,
    name: category.name ?? category.categoryName,
  });

  const getPriceParams = () => {
    switch (priceRange) {
      case 'under30000':
        return { maxPrice: 30000 };
      case '30000-50000':
        return { minPrice: 30000, maxPrice: 50000 };
      case '50000-100000':
        return { minPrice: 50000, maxPrice: 100000 };
      case 'over100000':
        return { minPrice: 100000 };
      default:
        return {};
    }
  };

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return '/placeholder-food.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  const loadCategories = async () => {
    try {
      const res = await foodAPI.getCategories();

      const data = Array.isArray(res.data) ? res.data : [];

      const normalized = data
        .map(normalizeCategory)
        .filter(category => category.id && category.name);

      setCategories(normalized);
    } catch (err) {
      console.error('Lỗi load danh mục:', err);
      setCategories([]);
    }
  };

  const loadFoods = async () => {
    setLoading(true);

    try {
      const priceParams = getPriceParams();

      const params = {
        keyword: keyword.trim(),
        categoryId: selectedCategoryId || null,
        sort,
        available: onlyAvailable ? true : null,
        ...priceParams,
      };

      const res = await foodAPI.getFoods(params);

      const data = Array.isArray(res.data) ? res.data : [];
      setFoods(data);
    } catch (err) {
      console.error('Lỗi load món ăn:', err);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadFoods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, priceRange, sort, onlyAvailable]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadFoods();
  };

  const handleResetFilter = () => {
    setKeyword('');
    setSelectedCategoryId('');
    setPriceRange('');
    setSort('default');
    setOnlyAvailable(true);

    setTimeout(() => {
      loadFoods();
    }, 0);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="menu-page">
        <div className="inner">
          <div className="menu-header">
            <h1>🍔 Thực đơn</h1>
            <p>Khám phá các món ăn ngon tại NLU-FoodStack</p>
          </div>

          <div className="menu-layout">
            <aside className="menu-sidebar">
              <div className="filter-card">
                <h3>🔍 Tìm kiếm</h3>

                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Tên món ăn..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    style={{
                      width: '100%',
                      height: 48,
                      border: '1px solid #e5e7eb',
                      borderRadius: 14,
                      padding: '0 14px',
                      marginBottom: 14,
                      outline: 'none',
                    }}
                  />

                  <button type="submit" className="btn btn-primary btn-full">
                    Tìm kiếm
                  </button>
                </form>
              </div>

              <div className="filter-card">
                <h3>📁 Danh mục</h3>

                <button
                  type="button"
                  className={`cat-filter-btn ${selectedCategoryId === '' ? 'active' : ''}`}
                  onClick={() => setSelectedCategoryId('')}
                >
                  Tất cả
                </button>

                {categories.map(category => (
                  <button
                    type="button"
                    key={category.id}
                    className={`cat-filter-btn ${
                      String(selectedCategoryId) === String(category.id) ? 'active' : ''
                    }`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="filter-card">
                <h3>💰 Khoảng giá</h3>

                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  style={{
                    width: '100%',
                    height: 48,
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    padding: '0 14px',
                    outline: 'none',
                    background: 'white',
                  }}
                >
                  <option value="">Tất cả mức giá</option>
                  <option value="under30000">Dưới 30.000đ</option>
                  <option value="30000-50000">30.000đ - 50.000đ</option>
                  <option value="50000-100000">50.000đ - 100.000đ</option>
                  <option value="over100000">Trên 100.000đ</option>
                </select>
              </div>

              <div className="filter-card">
                <h3>⚙️ Lọc khác</h3>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 18,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                  />
                  <span>Chỉ hiện món còn hàng</span>
                </label>

                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={handleResetFilter}
                >
                  Làm mới bộ lọc
                </button>
              </div>
            </aside>

            <main className="menu-main">
              <div className="menu-toolbar">
                <div className="result-count">
                  Tìm thấy <strong>{foods.length}</strong> món ăn
                </div>

                <div className="sort-select">
                  <span>Sắp xếp:</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="default">Mới nhất</option>
                    <option value="priceAsc">Giá tăng dần</option>
                    <option value="priceDesc">Giá giảm dần</option>
                    <option value="nameAsc">Tên A-Z</option>
                    <option value="soldDesc">Bán chạy</option>
                    <option value="ratingDesc">Đánh giá cao</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="icon">⏳</div>
                  <h3>Đang tải món ăn...</h3>
                </div>
              ) : foods.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🍽️</div>
                  <h3>Không tìm thấy món ăn phù hợp</h3>
                  <p>Thử thay đổi từ khóa hoặc bộ lọc khác.</p>
                </div>
              ) : (
                <div className="foods-grid">
                  {foods.map(food => {
                    const price = Number(food.price || 0);
                    const discountPrice = food.discountPrice ? Number(food.discountPrice) : null;

                    return (
                      <div className="food-card card" key={food.id}>
                        <div className="food-img-wrap">
                          <img
                            src={getImageSrc(food.imageUrl)}
                            alt={food.name}
                            className="food-img"
                          />

                          {food.isAvailable === false && (
                            <span className="sold-out-badge">Tạm hết</span>
                          )}
                        </div>

                        <div className="food-card-body">
                          <div className="food-card-category">
                            {food.categoryName || food.category?.name || 'Món ăn'}
                          </div>

                          <h3>{food.name}</h3>

                          <p className="food-card-desc">
                            {food.description || 'Món ăn ngon tại NLU-FoodStack'}
                          </p>

                          <div className="food-card-meta">
                            <span>⭐ {food.avgRating || '4.8'}</span>
                            <span>🔥 Đã bán {food.totalSold || 0}</span>
                          </div>

                          <div className="food-card-bottom">
                            <div className="food-price-box">
                              {discountPrice ? (
                                <>
                                  <strong>{discountPrice.toLocaleString('vi-VN')}đ</strong>
                                  <span>{price.toLocaleString('vi-VN')}đ</span>
                                </>
                              ) : (
                                <strong>{price.toLocaleString('vi-VN')}đ</strong>
                              )}
                            </div>

                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => navigate(`/foods/${food.id}`)}
                            >
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MenuPage;