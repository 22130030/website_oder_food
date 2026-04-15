import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './FoodCard.css';

const FoodCard = ({ food }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.preventDefault();        // Ngăn link bị click
    addToCart(food);
  };

  return (
    <Link to={`/food/${food.id}`} className="food-card">
      <div className="food-card-image">
        <img 
          src={food.imageUrl || 'https://via.placeholder.com/300x200?text=Mon+An'} 
          alt={food.name} 
        />
        {!food.available && <div className="sold-out-badge">Hết món</div>}
        <span className="category-tag">{food.category}</span>
      </div>

      <div className="food-card-body">
        <h3 className="food-name">{food.name}</h3>
        <p className="food-desc">{food.description}</p>
        
        <div className="food-rating">
          {'⭐'.repeat(Math.round(food.rating || 4))} ({food.reviewCount || 0} đánh giá)
        </div>

        <div className="food-card-footer">
          <span className="food-price">{food.price.toLocaleString('vi-VN')}đ</span>
          <button
            className="btn btn-primary btn-sm add-cart-btn"
            onClick={handleAddToCart}
            disabled={!food.available}
          >
            🛒 Thêm
          </button>
        </div>
      </div>
    </Link>
  );
};

export default FoodCard;