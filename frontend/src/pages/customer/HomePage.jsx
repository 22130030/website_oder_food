import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import { foodAPI } from '../../services/api';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [categories, setCategories] = useState([]);
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [keyword, setKeyword] = useState('');

  const normalizeCategory = (category) => ({
    id: category.id ?? category.categoryId,
    name: category.name ?? category.categoryName,
  });

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
        .filter(category => category.id && category.name)
        .slice(0, 5);

      setCategories(normalized);
    } catch (err) {
      console.error('Lỗi load danh mục home:', err);
      setCategories([]);
    }
  };

  const loadFeaturedFoods = async () => {
    try {
      const res = await foodAPI.getFoods({
        available: true,
        sort: 'soldDesc',
      });

      const data = Array.isArray(res.data) ? res.data : [];

      setFeaturedFoods(data.slice(0, 8));
    } catch (err) {
      console.error('Lỗi load món nổi bật:', err);
      setFeaturedFoods([]);
    }
  };

  useEffect(() => {
    loadCategories();
    loadFeaturedFoods();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const query = keyword.trim();

    if (query) {
      navigate(`/menu?keyword=${encodeURIComponent(query)}`);
    } else {
      navigate('/menu');
    }
  };

  const goToCategory = (categoryId) => {
    navigate(`/menu?categoryId=${categoryId}`);
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Đặt đồ ăn ngon <br />
                <span>Giao nhanh tận nơi</span>
              </h1>

              <p>
                NLU-FoodStack giúp bạn dễ dàng tìm kiếm, chọn món và đặt món ăn yêu thích
                chỉ trong vài phút.
              </p>

              <form className="hero-search" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Bạn muốn ăn món gì hôm nay?"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />

                <button type="submit" className="btn btn-primary">
                  Tìm kiếm
                </button>
              </form>

              <div className="hero-stats">
                <div className="stat-item">
                  <strong>200+</strong>
                  <span>Món ăn</span>
                </div>

                <div className="stat-item">
                  <strong>30 phút</strong>
                  <span>Giao hàng</span>
                </div>

                <div className="stat-item">
                  <strong>4.8★</strong>
                  <span>Đánh giá</span>
                </div>
              </div>
            </div>

            <div className="hero-image">
              <div className="hero-emoji">🍔</div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-inner">
          <div className="section-header">
            <h2>📁 Danh mục món ăn</h2>

            <Link to="/menu" className="see-all">
              Xem tất cả
            </Link>
          </div>

          <div className="categories-grid">
            {categories.length === 0 ? (
              <div className="home-empty-card">
                Chưa có danh mục món ăn.
              </div>
            ) : (
              categories.map(category => (
                <button
                  type="button"
                  key={category.id}
                  className="category-card"
                  onClick={() => goToCategory(category.id)}
                >
                  <span className="cat-icon">🍽️</span>
                  <span>{category.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-inner">
          <div className="section-header">
            <h2>🔥 Món ăn nổi bật</h2>

            <Link to="/menu" className="see-all">
              Xem tất cả
            </Link>
          </div>

          {featuredFoods.length === 0 ? (
            <div className="home-empty-card">
              Chưa có món ăn nổi bật.
            </div>
          ) : (
            <div className="foods-featured">
              {featuredFoods.map(food => {
                const price = Number(food.price || 0);
                const discountPrice = food.discountPrice
                  ? Number(food.discountPrice)
                  : null;

                return (
                  <div className="home-food-card" key={food.id}>
                    <div className="home-food-img-wrap">
                      <img
                        src={getImageSrc(food.imageUrl)}
                        alt={food.name}
                        className="home-food-img"
                      />
                    </div>

                    <div className="home-food-content">
                      <span className="home-food-category">
                        {food.categoryName || food.category?.name || 'Món ăn'}
                      </span>

                      <h3>{food.name}</h3>

                      <p>
                        {food.description || 'Món ăn ngon tại NLU-FoodStack'}
                      </p>

                      <div className="home-food-meta">
                        <span>⭐ {food.avgRating || '4.8'}</span>
                        <span>🔥 {food.totalSold || 0}</span>
                      </div>

                      <div className="home-food-bottom">
                        <div className="home-price-box">
                          {discountPrice ? (
                            <>
                              <strong>
                                {discountPrice.toLocaleString('vi-VN')}đ
                              </strong>
                              <span>{price.toLocaleString('vi-VN')}đ</span>
                            </>
                          ) : (
                            <strong>{price.toLocaleString('vi-VN')}đ</strong>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => addToCart(food)}
                          >
                            Thêm giỏ
                          </button>

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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="cta-section">
        <div className="home-inner" style={{ textAlign: 'center' }}>
          <h2>Sẵn sàng đặt món?</h2>
          <p>Khám phá thực đơn phong phú và đặt món ngay hôm nay.</p>

          <div className="cta-buttons">
            <Link to="/menu" className="btn btn-primary">
              Xem thực đơn
            </Link>

            <Link to="/chat" className="btn btn-secondary">
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;