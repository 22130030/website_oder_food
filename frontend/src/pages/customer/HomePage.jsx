import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import { foodAPI } from '../../services/api';
import './HomePage.css';
import FoodCard from '../../components/customer/FoodCard';

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

  const loadCategories = useCallback(async () => {
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
  }, []);

  const loadFeaturedFoods = useCallback(async () => {
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
  }, []);
  useEffect(() => {
    loadCategories();
    loadFeaturedFoods();
  }, [loadCategories, loadFeaturedFoods]);

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
            <div className="home-empty-card">Chưa có món ăn nổi bật.</div>
          ) : (
            <div className="foods-featured">
              {featuredFoods.map((food) => {
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