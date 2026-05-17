import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './FoodCard.css';

// ==================== FOOD CARD COMPONENT ====================

const FoodCard = ({ food }) => {
  // ==================== HOOKS ====================

  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // ==================== HANDLERS ====================

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(food);

    // Show feedback animation
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  // ==================== RENDER ====================

  const available = food.available ?? food.isAvailable ?? true;
  const price = Number(food.price || food.priceV2 || 0);

  return (
    <Link to={`/foods/${food.id}`} className="food-card">
      {/* ========== CARD IMAGE ========== */}
      <div className="food-card-image">
        <img
          src={
            food.imageUrl ||
            'https://via.placeholder.com/300x200?text=Mon+An'
          }
          alt={food.name}
        />
        {!available && <div className="sold-out-badge">Hết món</div>}
        <span className="category-tag">{food.categoryName || food.category || (food.category?.name) || 'Món ăn'}</span>
      </div>

      {/* ========== CARD BODY ========== */}
      <div className="food-card-body">
        <h3 className="food-name">{food.name}</h3>
        <p className="food-desc">{food.description}</p>

        <div className="food-rating">
          {'⭐'.repeat(Math.round(food.rating || 4))} ({food.reviewCount || 0}{' '}
          đánh giá)
        </div>

        {/* ========== CARD FOOTER ========== */}
        <div className="food-card-footer">
          <span className="food-price">{price.toLocaleString('vi-VN')}đ</span>
          <button
            className={`btn btn-primary btn-sm add-cart-btn ${isAdded ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={!available}
            title={available ? 'Thêm vào giỏ hàng' : 'Món này đã hết'}
          >
            {isAdded ? '✓ Thêm rồi' : '🛒 Thêm'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default FoodCard;