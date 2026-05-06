import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { foodAPI } from '../../services/api';
import './FoodDetailPage.css';

const FoodDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [food, setFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return '/placeholder-food.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  const loadFoodDetail = async () => {
    setLoading(true);

    try {
      const res = await foodAPI.getFoodById(id);
      setFood(res.data);
    } catch (err) {
      console.error('Lỗi load chi tiết món ăn:', err);
      setFood(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoodDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const getDisplayPrice = () => {
    if (!food) return 0;

    if (food.discountPrice && Number(food.discountPrice) > 0) {
      return Number(food.discountPrice);
    }

    return Number(food.price || 0);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!food) return;

    const cartItem = {
      id: food.id,
      name: food.name,
      price: getDisplayPrice(),
      imageUrl: food.imageUrl,
      categoryName: food.categoryName || food.category?.name || 'Món ăn',
    };

    addToCart(cartItem, quantity);
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!food) return;

    const cartItem = {
      id: food.id,
      name: food.name,
      price: getDisplayPrice(),
      imageUrl: food.imageUrl,
      categoryName: food.categoryName || food.category?.name || 'Món ăn',
    };

    addToCart(cartItem, quantity);
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Navbar />

        <div className="food-detail-page">
          <div className="inner">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Quay lại
            </button>

            <div className="empty-state card">
              <div className="icon">⏳</div>
              <h3>Đang tải chi tiết món ăn...</h3>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  if (!food) {
    return (
      <div className="page-wrapper">
        <Navbar />

        <div className="food-detail-page">
          <div className="inner">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Quay lại
            </button>

            <div className="empty-state card">
              <div className="icon">🍽️</div>
              <h3>Không tìm thấy món ăn</h3>
              <p>Món ăn này có thể đã bị xóa hoặc không còn tồn tại.</p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  const price = Number(food.price || 0);
  const discountPrice =
    food.discountPrice && Number(food.discountPrice) > 0
      ? Number(food.discountPrice)
      : null;

  const finalPrice = discountPrice || price;
  const totalPrice = finalPrice * quantity;

  const isAvailable = food.isAvailable !== false;

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="food-detail-page">
        <div className="inner">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>

          <div className="food-detail-layout">
            <div className="food-detail-image">
              <img src={getImageSrc(food.imageUrl)} alt={food.name} />

              {!isAvailable && (
                <div className="sold-out-overlay">
                  Hết món
                </div>
              )}
            </div>

            <div className="food-detail-info">
              <span className="detail-category">
                {food.categoryName || food.category?.name || 'Món ăn'}
              </span>

              <h1>{food.name}</h1>

              <div className="detail-rating">
                ⭐⭐⭐⭐⭐
                <strong> {food.avgRating || '4.8'}</strong>
                <span> ({food.totalSold || 0} đã bán)</span>
              </div>

              <p className="detail-desc">
                {food.description || 'Món ăn ngon tại NLU-FoodStack.'}
              </p>

              <div className="detail-meta">
                <span>⏱️ Chuẩn bị: <strong>10 phút</strong></span>
                <span>🚚 Giao hàng: <strong>30 phút</strong></span>
              </div>

              <div className="ingredients-box">
                <h3>📌 Thông tin món ăn</h3>

                <div className="ingredients-list">
                  <span className="ingredient-tag">
                    {food.categoryName || food.category?.name || 'Món ăn'}
                  </span>

                  <span className="ingredient-tag">
                    {isAvailable ? 'Còn hàng' : 'Tạm hết'}
                  </span>

                  <span className="ingredient-tag">
                    Đã bán {food.totalSold || 0}
                  </span>
                </div>
              </div>

              <div className="price-section">
                <div className="detail-price">
                  {discountPrice ? (
                    <>
                      <span style={{ color: 'var(--primary)' }}>
                        {discountPrice.toLocaleString('vi-VN')}đ
                      </span>

                      <span
                        style={{
                          marginLeft: 12,
                          color: '#999',
                          fontSize: 20,
                          textDecoration: 'line-through',
                        }}
                      >
                        {price.toLocaleString('vi-VN')}đ
                      </span>
                    </>
                  ) : (
                    <span>{price.toLocaleString('vi-VN')}đ</span>
                  )}
                </div>

                <div className="quantity-selector">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    -
                  </button>

                  <span>{quantity}</span>

                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    +
                  </button>
                </div>

                <div
                  style={{
                    marginBottom: 20,
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  Tổng tiền:{' '}
                  <span style={{ color: 'var(--primary)' }}>
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {added && (
                  <div
                    style={{
                      marginBottom: 14,
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: '#ecfdf5',
                      color: '#047857',
                      fontWeight: 700,
                    }}
                  >
                    ✅ Đã thêm vào giỏ hàng
                  </div>
                )}

                <div className="detail-actions">
                  <button
                    className="btn btn-outline"
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                  >
                    🛒 Thêm vào giỏ
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={handleBuyNow}
                    disabled={!isAvailable}
                  >
                    🚀 Đặt ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="reviews-section">
            <h2>💬 Đánh giá từ khách hàng</h2>

            <div className="reviews-list">
              <div className="review-card card">
                <div className="review-header">
                  <div className="reviewer-avatar">A</div>

                  <div>
                    <strong>Khách hàng</strong>
                    <div className="review-rating">⭐⭐⭐⭐⭐</div>
                  </div>

                  <span className="review-date">Hôm nay</span>
                </div>

                <p className="review-comment">
                  Món ăn ngon, giao hàng nhanh và chất lượng ổn định.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FoodDetailPage;