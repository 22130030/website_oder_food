import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import FoodCard from '../../components/customer/FoodCard';
import './MenuPage.css';

const MOCK_FOODS = [
  { id: 1, name: 'Phở Bò Đặc Biệt', price: 75000, category: 'Món chính', rating: 5, reviewCount: 128, available: true, description: 'Phở bò tươi ngon với nước dùng hầm 12 tiếng', imageUrl: 'https://via.placeholder.com/300x200?text=Pho+Bo' },
  { id: 2, name: 'Cơm Tấm Sườn Nướng', price: 65000, category: 'Món chính', rating: 4, reviewCount: 95, available: true, description: 'Cơm tấm sườn nướng thơm lừng kèm bì chả', imageUrl: 'https://via.placeholder.com/300x200?text=Com+Tam' },
  { id: 3, name: 'Bún Bò Huế', price: 70000, category: 'Món chính', rating: 4, reviewCount: 74, available: true, description: 'Bún bò Huế cay nồng đậm đà', imageUrl: 'https://via.placeholder.com/300x200?text=Bun+Bo' },
  { id: 4, name: 'Trà Sữa Trân Châu', price: 35000, category: 'Đồ uống', rating: 4, reviewCount: 203, available: true, description: 'Trà sữa thơm ngon với trân châu dai mịn', imageUrl: 'https://via.placeholder.com/300x200?text=Tra+Sua' },
  { id: 5, name: 'Bánh Mì Thịt Nướng', price: 25000, category: 'Ăn nhẹ', rating: 4, reviewCount: 156, available: true, description: 'Bánh mì giòn rụm với nhân thịt nướng', imageUrl: 'https://via.placeholder.com/300x200?text=Banh+Mi' },
  { id: 6, name: 'Lẩu Thái Hải Sản', price: 280000, category: 'Lẩu', rating: 5, reviewCount: 67, available: true, description: 'Lẩu Thái cay nồng với hải sản tươi sống', imageUrl: 'https://via.placeholder.com/300x200?text=Lau+Thai' },
  { id: 7, name: 'Pizza Hải Sản', price: 185000, category: 'Pizza', rating: 4, reviewCount: 89, available: true, description: 'Pizza đế mỏng với topping hải sản phong phú', imageUrl: 'https://via.placeholder.com/300x200?text=Pizza' },
  { id: 8, name: 'Nước Cam Vắt', price: 25000, category: 'Đồ uống', rating: 5, reviewCount: 112, available: false, description: 'Nước cam tươi vắt 100% nguyên chất', imageUrl: 'https://via.placeholder.com/300x200?text=Cam+Vat' },
];

const CATEGORIES = ['Tất cả', 'Món chính', 'Đồ uống', 'Ăn nhẹ', 'Lẩu', 'Pizza', 'Tráng miệng'];

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'rating', label: 'Đánh giá cao nhất' },
  { value: 'popular', label: 'Phổ biến nhất' },
];

const MenuPage = () => {
  const [searchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'Tất cả');
  const [sort, setSort] = useState('default');
  const [showAvailable, setShowAvailable] = useState(false);

  useEffect(() => {
    let filtered = [...MOCK_FOODS];

    if (search) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (activeCategory !== 'Tất cả') {
      filtered = filtered.filter(f => f.category === activeCategory);
    }
    if (showAvailable) {
      filtered = filtered.filter(f => f.available);
    }

    switch (sort) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'rating': filtered.sort((a, b) => b.rating - a.rating); break;
      case 'popular': filtered.sort((a, b) => b.reviewCount - a.reviewCount); break;
      default: break;
    }

    setFoods(filtered);
  }, [search, activeCategory, sort, showAvailable]);

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="menu-page">
        <div className="inner">
          <div className="menu-header">
            <h1>🍽️ Thực đơn</h1>
            <p>Khám phá hơn {MOCK_FOODS.length} món ăn ngon mỗi ngày</p>
          </div>

          <div className="menu-layout">
            {/* Sidebar lọc */}
            <div className="menu-sidebar">
              <div className="filter-card card">
                <h3>🔍 Tìm kiếm</h3>
                <input 
                  type="text" 
                  placeholder="Tên món ăn..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>

              <div className="filter-card card">
                <h3>📂 Danh mục</h3>
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    className={`cat-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="filter-card card">
                <h3>⚙️ Lọc khác</h3>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={showAvailable} 
                    onChange={e => setShowAvailable(e.target.checked)} 
                  />
                  Chỉ hiện món còn hàng
                </label>
              </div>
            </div>

            {/* Nội dung chính */}
            <div className="menu-main">
              <div className="menu-toolbar">
                <span className="result-count">
                  Tìm thấy <strong>{foods.length}</strong> món ăn
                </span>
                <div className="sort-select">
                  <label>Sắp xếp: </label>
                  <select value={sort} onChange={e => setSort(e.target.value)}>
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {foods.length === 0 ? (
                <div className="empty-state">
                  <div className="icon">🔍</div>
                  <h3>Không tìm thấy món nào!</h3>
                  <p>Hãy thử thay đổi từ khóa hoặc danh mục.</p>
                </div>
              ) : (
                <div className="foods-grid">
                  {foods.map(food => (
                    <FoodCard key={food.id} food={food} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MenuPage;