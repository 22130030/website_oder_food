import React, { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { foodAPI } from '../../services/api';
import FoodCard from '../../components/customer/FoodCard';
import './MenuPage.css';

const leftDecorations = [
  {
    title: 'Salad tươi',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500',
    tone: 'fresh',
  },
  {
    title: 'Gà giòn',
    image:
      'https://images.unsplash.com/photo-1562967916-eb82221dfb92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500',
    tone: 'warm',
  },
  {
    title: 'Burger ngon',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500',
    tone: 'gold',
  },
];

const rightDecorations = [
  {
    title: 'Trà trái cây',
    image:
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500',
    tone: 'berry',
  },
  {
    title: 'Nước mát lạnh',
    image:
      'https://images.unsplash.com/photo-1544145945-f90425340c7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500',
    tone: 'fresh',
  },
  {
    title: 'Món tráng miệng',
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=500',
    tone: 'gold',
  },
];

const MenuPage = () => {
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
        <div className="menu-side-decor" aria-hidden="true">
          <div className="menu-side-rail menu-side-left">
            {leftDecorations.map((item, index) => (
              <div
                key={`left-${index}`}
                className={`menu-decor-card tone-${item.tone} ${index === 1 ? 'offset-card' : ''}`}
              >
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>

          <div className="menu-side-rail menu-side-right">
            {rightDecorations.map((item, index) => (
              <div
                key={`right-${index}`}
                className={`menu-decor-card tone-${item.tone} ${index === 1 ? 'offset-card' : ''}`}
              >
                <img src={item.image} alt={item.title} />
                <span>{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="inner">
          <section className="menu-header">
            <div className="menu-heading-copy">
              <span className="menu-kicker">THỰC ĐƠN HÔM NAY</span>
              <h1>Chọn món ngon, <span>đặt thật nhanh</span></h1>
              <p>Khám phá các món hấp dẫn, lọc theo khẩu vị và nhận món nóng hổi tận nơi.</p>
            </div>
            <div className="menu-header-perks">
              <div><strong>30'</strong><span>Giao nhanh</span></div>
              <div><strong>4.8★</strong><span>Yêu thích</span></div>
              <div><strong>20K</strong><span>Phí giao tối đa</span></div>
            </div>
          </section>

          <div className="menu-layout">
            <aside className="menu-sidebar">
              <div className="filter-card">
                <h3>Tìm kiếm</h3>

                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Tên món ăn..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="filter-input"
                  />

                  <button type="submit" className="btn btn-primary btn-full">
                    Tìm kiếm
                  </button>
                </form>
              </div>

              <div className="filter-card">
                <h3>Danh mục</h3>

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
                    className={`cat-filter-btn ${String(selectedCategoryId) === String(category.id) ? 'active' : ''}`}
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className="filter-card">
                <h3>Khoảng giá</h3>

                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Tất cả mức giá</option>
                  <option value="under30000">Dưới 30.000đ</option>
                  <option value="30000-50000">30.000đ - 50.000đ</option>
                  <option value="50000-100000">50.000đ - 100.000đ</option>
                  <option value="over100000">Trên 100.000đ</option>
                </select>
              </div>

              <div className="filter-card">
                <h3>Lọc khác</h3>

                <label className="stock-toggle">
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
                <div className="menu-empty-state">
                  <div className="icon">⏳</div>
                  <h3>Đang tải món ăn...</h3>
                </div>
              ) : foods.length === 0 ? (
                <div className="menu-empty-state">
                  <div className="icon">🍽️</div>
                  <h3>Không tìm thấy món ăn phù hợp</h3>
                  <p>Thử thay đổi từ khóa hoặc bộ lọc khác.</p>
                </div>
              ) : (
                <div className="foods-grid">
                  {foods.map((food) => {
                    const mapped = {
                      id: food.id,
                      name: food.name,
                      description: food.description,
                      imageUrl: food.imageUrl,
                      available: food.isAvailable ?? food.available,
                      categoryName: food.categoryName ?? (food.category && food.category.name) ?? food.category,
                      price: food.discountPrice ? food.discountPrice : food.price,
                      rating: food.avgRating ?? food.rating,
                      reviewCount: food.totalReviews ?? 0,
                    };

                    return <FoodCard key={food.id} food={mapped} />;
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
