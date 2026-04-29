import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import FoodCard from '../../components/customer/FoodCard';
import './HomePage.css';

// ==================== CONSTANTS ====================

const MOCK_FOODS = [
  {
    id: 1,
    name: 'Phở Bò Đặc Biệt',
    price: 75000,
    category: 'Món chính',
    rating: 5,
    reviewCount: 128,
    available: true,
    description: 'Phở bò tươi ngon với nước dùng hầm 12 tiếng',
    imageUrl: 'https://via.placeholder.com/300x200?text=Pho+Bo',
  },
  {
    id: 2,
    name: 'Cơm Tấm Sườn Nướng',
    price: 65000,
    category: 'Món chính',
    rating: 4,
    reviewCount: 95,
    available: true,
    description: 'Cơm tấm sườn nướng thơm lừng kèm bì chả',
    imageUrl: 'https://via.placeholder.com/300x200?text=Com+Tam',
  },
  {
    id: 3,
    name: 'Bún Bò Huế',
    price: 70000,
    category: 'Món chính',
    rating: 4,
    reviewCount: 74,
    available: true,
    description: 'Bún bò Huế cay nồng đậm đà hương vị miền Trung',
    imageUrl: 'https://via.placeholder.com/300x200?text=Bun+Bo',
  },
  {
    id: 4,
    name: 'Trà Sữa Trân Châu',
    price: 35000,
    category: 'Đồ uống',
    rating: 4,
    reviewCount: 203,
    available: true,
    description: 'Trà sữa thơm ngon với trân châu dai mịn',
    imageUrl: 'https://via.placeholder.com/300x200?text=Tra+Sua',
  },
];

const CATEGORIES = [
  { name: 'Món chính', icon: '🍜' },
  { name: 'Đồ uống', icon: '🧃' },
  { name: 'Ăn nhẹ', icon: '🥐' },
  { name: 'Lẩu', icon: '🍲' },
  { name: 'Pizza', icon: '🍕' },
];

// ==================== COMPONENT ====================

const HomePage = () => {
  // State hooks
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState(MOCK_FOODS);

  // Navigation hook
  const navigate = useNavigate();

  // ==================== FUNCTIONS ====================

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/menu?search=${searchQuery}`);
  };

  // ==================== EFFECTS ====================

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/foods');
        setFoods(res.data);
      } catch (error) {
        console.error('Load foods failed:', error.response?.data || error.message);
        setFoods(MOCK_FOODS);
      }
    };

    fetchFoods();
  }, []);

  // ==================== RENDER ====================

  return (
    <div className="page-wrapper">
      <Navbar />

      {/* ========== HERO SECTION ========== */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Đặt đồ ăn ngon 🍔
                <br />
                <span>Giao nhanh tận nơi!</span>
              </h1>
              <p>Hơn 200+ món ăn từ các nhà hàng hàng đầu. Giao hàng trong 30 phút.</p>
              <form onSubmit={handleSearch} className="hero-search">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm món ăn yêu thích..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                  <strong>10K+</strong>
                  <span>Khách hàng</span>
                </div>
                <div className="stat-item">
                  <strong>30'</strong>
                  <span>Giao hàng</span>
                </div>
                <div className="stat-item">
                  <strong>4.8 ⭐</strong>
                  <span>Đánh giá</span>
                </div>
              </div>
            </div>
            <div className="hero-image">
              <div className="hero-emoji">🍱</div>
            </div>
          </div>
        </div>
      </section>
      {/* ========== FILTER SECTION ========== */}

      {/* ========== CATEGORIES SECTION ========== */}
      <section className="home-section">
        <div className="home-inner">
          <div className="section-header">
            <h2>📂 Danh mục món ăn</h2>
            <Link to="/menu" className="see-all">
              Xem tất cả →
            </Link>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/menu?category=${cat.name}`}
                className="category-card"
              >
                <span className="cat-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED FOODS SECTION ========== */}
      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="home-inner">
          <div className="section-header">
            <h2>🔥 Món ăn nổi bật</h2>
            <Link to="/menu" className="see-all">
              Xem tất cả →
            </Link>
          </div>
          <div className="foods-featured">
            {(foods.length > 0 ? foods : MOCK_FOODS).map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="cta-section">
        <div className="home-inner" style={{ textAlign: 'center' }}>
          <h2>Sẵn sàng đặt món chưa? 🚀</h2>
          <p>Đăng ký ngay để nhận ưu đãi chào mừng thành viên mới!</p>
          <div className="cta-buttons">
            <Link to="/menu" className="btn btn-primary btn-lg">
              Xem thực đơn
            </Link>
            <Link
              to="/register"
              className="btn btn-lg"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.6)',
              }}
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// ==================== EXPORT ====================

export default HomePage;