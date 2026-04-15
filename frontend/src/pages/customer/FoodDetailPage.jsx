import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './FoodDetailPage.css';

const MOCK_FOOD = {
  id: 1,
  name: 'Phở Bò Đặc Biệt',
  price: 75000,
  category: 'Món chính',
  rating: 4.8,
  reviewCount: 128,
  available: true,
  description: 'Phở bò tươi ngon với nước dùng được hầm từ xương bò trong 12 tiếng. Thêm vào đó là những lát thịt bò tươi mỏng, béo ngậy cùng bánh phở mềm mịn.',
  ingredients: ['Bánh phở tươi', 'Thịt bò tươi', 'Xương bò hầm', 'Hành lá', 'Ngò rí', 'Giá đỗ', 'Ớt, chanh'],
  imageUrl: 'https://via.placeholder.com/600x500?text=Phở+Bò+Đặc+Biệt',
  prepTime: '10 phút',
  calories: 450,
};

const REVIEWS = [
  { id: 1, user: 'Nguyễn Văn A', rating: 5, comment: 'Phở rất ngon, nước dùng đậm đà!', date: '2025-06-01' },
  { id: 2, user: 'Trần Thị B', rating: 4, comment: 'Thịt bò tươi, sợi phở mềm. Sẽ đặt lại!', date: '2025-05-28' },
  { id: 3, user: 'Lê Minh C', rating: 5, comment: 'Giao hàng nhanh, đồ ăn còn nóng hổi.', date: '2025-05-25' },
];

const FoodDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const food = { ...MOCK_FOOD, id: Number(id) || 1 };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(food, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    addToCart(food, quantity);
    navigate('/cart');
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="food-detail-page">
        <div className="inner">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>

          <div className="food-detail-layout">
            {/* Hình ảnh */}
            <div className="food-detail-image">
              <img src={food.imageUrl} alt={food.name} />
              {!food.available && <div className="sold-out-overlay">Hết món</div>}
            </div>

            {/* Thông tin món ăn */}
            <div className="food-detail-info">
              <span className="detail-category">{food.category}</span>
              <h1>{food.name}</h1>

              <div className="detail-rating">
                {'⭐'.repeat(Math.round(food.rating))} 
                <strong> {food.rating}</strong> ({food.reviewCount} đánh giá)
              </div>

              <p className="detail-desc">{food.description}</p>

              <div className="detail-meta">
                <span>⏱️ Chuẩn bị: <strong>{food.prepTime}</strong></span>
                <span>🔥 Calories: <strong>{food.calories} kcal</strong></span>
              </div>

              <div className="ingredients-box">
                <h3>🥗 Thành phần</h3>
                <div className="ingredients-list">
                  {food.ingredients.map((item, index) => (
                    <span key={index} className="ingredient-tag">{item}</span>
                  ))}
                </div>
              </div>

              <div className="price-section">
                <div className="detail-price">{food.price.toLocaleString('vi-VN')}đ</div>

                <div className="quantity-selector">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>

                <div className="detail-actions">
                  <button className="btn btn-outline" onClick={handleAddToCart}>
                    🛒 Thêm vào giỏ
                  </button>
                  <button className="btn btn-primary" onClick={handleBuyNow}>
                    🚀 Đặt ngay
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== PHẦN ĐÁNH GIÁ ==================== */}
          <div className="reviews-section">
            <h2>💬 Đánh giá từ khách hàng</h2>
            <div className="reviews-list">
              {REVIEWS.map(r => (
                <div key={r.id} className="review-card card">
                  <div className="review-header">
                    <div className="reviewer-avatar">{r.user[0]}</div>
                    <div>
                      <strong>{r.user}</strong>
                      <div className="review-rating">{'⭐'.repeat(r.rating)}</div>
                    </div>
                    <span className="review-date">{r.date}</span>
                  </div>
                  <p className="review-comment">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FoodDetailPage;