import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { foodAPI } from '../../services/api';
import './HomePage.css';
import FoodCard from '../../components/customer/FoodCard';

const HomePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [keyword, setKeyword] = useState('');

  const normalizeCategory = (category) => ({
    id: category.id ?? category.categoryId,
    name: category.name ?? category.categoryName,
  });

  const categoryDesigns = [
    {
      description: 'Cơm phần, cơm tấm, cơm gà...',
      image: 'https://images.unsplash.com/photo-1665199020996-66cfdf8cba00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Phở, bún bò, mì xào...',
      image: 'https://images.unsplash.com/photo-1597345637412-9fd611e758f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Gà rán giòn, gà sốt cay...',
      image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Pizza Ý, pizza hải sản...',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Burger bò, burger gà...',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Trà sữa, nước ép, sinh tố...',
      image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Bánh ngọt, kem, chè...',
      image: 'https://images.unsplash.com/photo-1530648672449-81f6c723e2f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
    {
      description: 'Món chay thanh đạm, bổ dưỡng',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    },
  ];

  const getCategoryDesign = (index) => categoryDesigns[index % categoryDesigns.length];

  const loadCategories = useCallback(async () => {
    try {
      const res = await foodAPI.getCategories();

      const data = Array.isArray(res.data) ? res.data : [];

      const normalized = data
        .map(normalizeCategory)
        .filter(category => category.id && category.name)
        .slice(0, 8);

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
              <span className="hero-eyebrow">Giao nhanh · Món tươi · Đặt dễ dàng</span>
              <h1>
                Đặt món ngon dễ dàng cùng{' '}
                <span>NLU FoodStack</span>
              </h1>

              <p>
                Khám phá hàng trăm món ăn hấp dẫn, đặt hàng nhanh chóng và giao tận nơi.
              </p>

              <form className="hero-search" onSubmit={handleSearch}>
                <span className="hero-search-icon">🔎</span>
                <input
                  type="text"
                  placeholder="Tìm món ăn yêu thích..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </form>

              <div className="hero-actions">
                <button type="button" className="hero-primary-btn" onClick={() => navigate('/menu')}>
                  Đặt món ngay
                </button>

                <Link to="/menu" className="hero-outline-btn">
                  Xem thực đơn
                </Link>
              </div>

              <div className="hero-proof">
                <span>⭐ 4.8/5 đánh giá</span>
                <span>Giao nhanh 30 phút</span>
                <span>🎁 Ưu đãi mỗi ngày</span>
              </div>
            </div>

            <div className="hero-showcase">
              <div className="hero-food-grid">
                <div className="hero-food-card">
                  <img
                    src="https://images.unsplash.com/photo-1547592180-85f173990554?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
                    alt="Món salad tươi"
                  />
                  <div>
                    <h3>Salad tươi</h3>
                    <strong>99.000đ</strong>
                  </div>
                </div>

                <div className="hero-food-card hero-food-card-offset">
                  <img
                    src="https://images.unsplash.com/photo-1494859802809-d069c3b71a8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
                    alt="Món cơm trộn"
                  />
                  <div>
                    <h3>Cơm trộn</h3>
                    <strong>75.000đ</strong>
                  </div>
                </div>
              </div>

              <div className="hero-sale-badge">Giảm 30%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="benefit-section">
        <div className="home-inner benefit-grid">
          <div className="benefit-card"><span>🛵</span><div><strong>Giao hàng nhanh</strong><p>Nhận món nóng trong khoảng 30 phút</p></div></div>
          <div className="benefit-card"><span>🥗</span><div><strong>Nguyên liệu tươi</strong><p>Lựa chọn món ngon mỗi ngày</p></div></div>
          <div className="benefit-card"><span>💳</span><div><strong>Thanh toán tiện lợi</strong><p>COD hoặc VNPAY an toàn</p></div></div>
          <div className="benefit-card"><span>💬</span><div><strong>Hỗ trợ tận tâm</strong><p>Luôn sẵn sàng giải đáp</p></div></div>
        </div>
      </section>

      <section className="category-section modern-home-section category-modern-section">
        <div className="modern-section-art category-art" aria-hidden="true">
          <span className="art-blob" />
          <span className="art-dots" />
          <span className="art-ring" />
        </div>
        <div className="home-inner">
          <div className="category-heading">
            <span className="home-section-eyebrow">Khám phá theo khẩu vị</span>
            <h2>Danh mục món ăn</h2>
            <p>Khám phá đa dạng món ăn từ nhiều ẩm thực</p>
          </div>

          <div className="categories-grid">
            {categories.length === 0 ? (
              <div className="home-empty-card">
                Chưa có danh mục món ăn.
              </div>
            ) : (
              categories.map((category, index) => {
                const design = getCategoryDesign(index);

                return (
                  <button
                    type="button"
                    key={category.id}
                    className="category-card"
                    onClick={() => goToCategory(category.id)}
                  >
                    <div className="category-image-wrap">
                      <img src={design.image} alt={category.name} />
                      <span className="category-overlay" />
                    </div>

                    <div className="category-info">
                      <h3>{category.name}</h3>
                      <p>{design.description}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="home-section modern-home-section featured-modern-section">
        <div className="modern-section-art featured-art" aria-hidden="true">
          <span className="art-blob" />
          <span className="art-dots" />
          <span className="art-line" />
        </div>
        <div className="home-inner">
          <div className="section-header featured-section-header">
            <div>
              <span className="home-section-eyebrow">Best seller hôm nay</span>
              <h2>🔥 Món ăn nổi bật</h2>
            </div>

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

      <section className="cta-section modern-home-section cta-modern-section">
        <div className="home-inner">
          <div className="cta-card">
            <div className="cta-art" aria-hidden="true">
              <span className="cta-ring cta-ring-one" />
              <span className="cta-ring cta-ring-two" />
              <span className="cta-dot-grid" />
            </div>
            <div className="cta-content">
              <span className="cta-badge">Ưu đãi giao tận nơi</span>
              <h2>Sẵn sàng thưởng thức món ngon?</h2>
              <p>Khám phá thực đơn phong phú, ưu đãi hấp dẫn và giao hàng nhanh chóng tới tận nơi.</p>

              <div className="cta-buttons">
                <Link to="/menu" className="btn btn-primary">
                  Xem thực đơn
                </Link>

                <Link to="/chat" className="btn cta-support-btn">
                  Liên hệ hỗ trợ
                </Link>
              </div>
            </div>

            <div className="cta-visual" aria-hidden="true">
              <img src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900" alt="Đặt món" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
