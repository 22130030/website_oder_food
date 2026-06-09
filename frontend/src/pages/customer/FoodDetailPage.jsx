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
  const [reviews, setReviews] = useState([]);

  const getImageSrc = (imageUrl) => {
    if (!imageUrl) return '/placeholder-food.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:8080${imageUrl}`;
  };

  const formatReviewDate = (value) => {
  if (!value) return "Hôm nay";

  const date = new Date(value);
  const now = new Date();

  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

const renderStars = (rating) => {
  const value = Number(rating || 0);

  return "★★★★★"
    .split("")
    .map((star, index) => (index < value ? "★" : "☆"))
    .join("");
};

const getAvatarLetter = (name) => {
  return (name || "K").trim().charAt(0).toUpperCase();
};

  const loadFoodDetail = async () => {
  setLoading(true);

  try {
    const [foodRes, reviewRes] = await Promise.all([
      foodAPI.getFoodById(id),
      foodAPI.getFoodReviews(id),
    ]);

    setFood(foodRes.data);
    setReviews(Array.isArray(reviewRes.data) ? reviewRes.data : []);
  } catch (err) {
    console.error("Lỗi load chi tiết món ăn:", err);
    setFood(null);
    setReviews([]);
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

  const renderStatePage = (icon, title, message = '') => (
    <div className="page-wrapper">
      <Navbar />

      <div className="food-detail-page detail-state-page">
        <div className="inner">
          <button className="back-btn" type="button" onClick={() => navigate(-1)}>
            <span>←</span> Quay lại
          </button>

          <div className="empty-state card">
            <div className="icon">{icon}</div>
            <h3>{title}</h3>
            {message && <p>{message}</p>}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );

  if (loading) {
    return renderStatePage('⏳', 'Đang tải chi tiết món ăn...');
  }

  if (!food) {
    return renderStatePage(
      '🍽️',
      'Không tìm thấy món ăn',
      'Món ăn này có thể đã bị xóa hoặc không còn tồn tại.'
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
  const categoryName = food.categoryName || food.category?.name || 'Món ăn';
  const reviewCount = reviews.length;
  const rating = Number(food.avgRating || 0);
  const displayRating = rating > 0 ? rating.toFixed(1) : "Chưa có";
  const totalSold = food.totalSold || 0;
  const discountPercent =
    discountPrice && price > discountPrice
      ? Math.round(((price - discountPrice) / price) * 100)
      : 0;

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="food-detail-page">
        <div className="detail-floating-decor decor-left" aria-hidden="true">🍅</div>
        <div className="detail-floating-decor decor-right" aria-hidden="true">🥤</div>
        <div className="detail-floating-decor decor-bottom" aria-hidden="true">🥬</div>

        <div className="inner">
          <div className="detail-breadcrumb">
            <button className="back-btn" type="button" onClick={() => navigate(-1)}>
              <span>←</span> Quay lại
            </button>

            <div className="breadcrumb-path">
              <button type="button" onClick={() => navigate('/menu')}>Thực đơn</button>
              <span>/</span>
              <span>{categoryName}</span>
              <span>/</span>
              <strong>{food.name}</strong>
            </div>
          </div>

          <section className="food-hero-card">
            <div className="food-media-column">
              <div className="food-detail-image">
                <div className="image-badges">
                  <span className="best-choice-badge">Món được yêu thích</span>
                  {discountPercent > 0 && (
                    <span className="discount-badge">-{discountPercent}%</span>
                  )}
                </div>

                <img src={getImageSrc(food.imageUrl)} alt={food.name} />

                {!isAvailable && (
                  <div className="sold-out-overlay">
                    <span>Tạm hết món</span>
                    <small>Vui lòng chọn món khác</small>
                  </div>
                )}
              </div>

              <div className="image-service-grid">
                <div className="service-item">
                  <div className="service-icon">🌿</div>
                  <div>
                    <strong>Tươi ngon</strong>
                    <span>Chế biến trong ngày</span>
                  </div>
                </div>
                <div className="service-item">
                  <div className="service-icon">📦</div>
                  <div>
                    <strong>Đóng gói sạch</strong>
                    <span>An toàn giao nhận</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="food-detail-info">
              <div className="detail-top-tags">
                <span className="detail-category">{categoryName}</span>
                <span className={`stock-status ${isAvailable ? 'available' : 'unavailable'}`}>
                  {isAvailable ? '● Còn hàng' : '● Tạm hết'}
                </span>
              </div>

              <h1>{food.name}</h1>

              <div className="detail-rating">
  <span className="stars">{rating > 0 ? renderStars(Math.round(rating)) : "☆☆☆☆☆"}</span>
  <strong>{displayRating}</strong>
  <span className="divider"></span>
  <span>{reviewCount} đánh giá</span>
  <span className="divider"></span>
  <span>{totalSold} lượt đặt</span>
</div>

              <p className="detail-desc">
                {food.description || 'Món ăn nóng hổi, thơm ngon và được chuẩn bị cẩn thận tại NLU-FoodStack.'}
              </p>

              <div className="detail-meta">
                <div className="meta-item">
                  <span>⏱️</span>
                  <div><small>Chuẩn bị</small><strong>10 phút</strong></div>
                </div>
                <div className="meta-item">
                  <span>🛵</span>
                  <div><small>Giao dự kiến</small><strong>30 phút</strong></div>
                </div>
                <div className="meta-item">
                  <span>⭐</span>
                  <div>
  <small>Đánh giá</small>
  <strong>{rating > 0 ? `${displayRating}/5` : "Chưa có"}</strong>
</div>
                </div>
              </div>

              <div className="ingredients-box">
                <h3>Thông tin món ăn</h3>
                <div className="ingredients-list">
                  <span className="ingredient-tag">🍽️ {categoryName}</span>
                  <span className={`ingredient-tag ${isAvailable ? 'success-tag' : 'danger-tag'}`}>
                    {isAvailable ? '✓ Có thể đặt ngay' : 'Tạm ngưng phục vụ'}
                  </span>
                  <span className="ingredient-tag">🔥 Đã bán {totalSold}</span>
                </div>
              </div>

              <div className="purchase-panel">
                <div className="price-row">
                  <div>
                    <p className="price-label">Giá món</p>
                    <div className="detail-price">
                      <span>{finalPrice.toLocaleString('vi-VN')}đ</span>
                      {discountPrice && (
                        <span className="detail-original-price">{price.toLocaleString('vi-VN')}đ</span>
                      )}
                    </div>
                  </div>

                  <div className="quantity-wrap">
                    <p className="price-label">Số lượng</p>
                    <div className="quantity-selector">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => setQuantity(q => q + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="detail-total">
                  <span>Tổng thanh toán</span>
                  <strong>{totalPrice.toLocaleString('vi-VN')}đ</strong>
                </div>

                {added && (
                  <div className="add-success-message">
                    ✅ Đã thêm món vào giỏ hàng của bạn.
                  </div>
                )}

                <div className="detail-actions">
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                  >
                     Thêm vào giỏ
                  </button>

                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!isAvailable}
                  >
                    Đặt ngay
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="detail-extra-section">
            <div className="detail-benefits-card">
              <span className="section-kicker">QUYỀN LỢI KHI ĐẶT MÓN</span>
              <h2>Thưởng thức món ngon thật an tâm</h2>
              <div className="benefit-list">
                <div>
                  <span>🚀</span>
                  <strong>Giao hàng nhanh</strong>
                  <p>Ưu tiên xử lý đơn ngay sau khi đặt.</p>
                </div>
                <div>
                  <span>🛡️</span>
                  <strong>Thanh toán an toàn</strong>
                  <p>Thông tin đơn hàng được bảo vệ.</p>
                </div>
                <div>
                  <span>💬</span>
                  <strong>Hỗ trợ tận tình</strong>
                  <p>Luôn sẵn sàng khi bạn cần giúp đỡ.</p>
                </div>
              </div>
            </div>

            <div className="reviews-section">
  <div className="reviews-heading">
    <div>
      <span className="section-kicker">PHẢN HỒI KHÁCH HÀNG</span>
      <h2>Đánh giá món ăn</h2>
    </div>

    <div className="review-score">
      <strong>{rating > 0 ? displayRating : "0"}</strong>
      <span>{rating > 0 ? renderStars(Math.round(rating)) : "☆☆☆☆☆"}</span>
      <small>
        {reviewCount > 0
          ? `Dựa trên ${reviewCount} phản hồi`
          : "Chưa có phản hồi"}
      </small>
    </div>
  </div>

  <div className="reviews-list">
    {reviews.length === 0 ? (
      <div className="review-empty">
        <div>💬</div>
        <strong>Chưa có đánh giá nào</strong>
        <p>Hãy là người đầu tiên đánh giá món ăn này sau khi đặt hàng.</p>
      </div>
    ) : (
      reviews.map((review) => (
        <div className="review-card" key={review.id}>
          <div className="review-header">
            {review.customerAvatar ? (
              <img
                className="reviewer-avatar-img"
                src={
                  review.customerAvatar.startsWith("http")
                    ? review.customerAvatar
                    : `http://localhost:8080${review.customerAvatar}`
                }
                alt={review.customerName || "Khách hàng"}
              />
            ) : (
              <div className="reviewer-avatar">
                {getAvatarLetter(review.customerName)}
              </div>
            )}

            <div>
              <strong>{review.customerName || "Khách hàng"}</strong>
              <div className="review-rating">
                {renderStars(review.rating)}
              </div>
            </div>

            <span className="review-date">
              {formatReviewDate(review.createdAt)}
            </span>
          </div>

          <p className="review-comment">
            {review.comment || "Khách hàng chưa để lại nhận xét."}
          </p>
        </div>
      ))
    )}
  </div>
</div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FoodDetailPage;
