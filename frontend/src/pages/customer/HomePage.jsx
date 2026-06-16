import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import FoodCard from "../../components/customer/FoodCard";

import { foodAPI } from "../../services/api";

import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [featuredFoods, setFeaturedFoods] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const normalizeCategory = (category) => ({
    id: category.id ?? category.categoryId,
    name: category.name ?? category.categoryName,
  });

  const categoryDesigns = [
    {
      description: "Cơm phần, cơm tấm, cơm gà...",
      image:
        "https://images.unsplash.com/photo-1665199020996-66cfdf8cba00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Phở, bún bò, mì xào...",
      image:
        "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Gà rán giòn, gà sốt cay...",
      image:
        "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Pizza Ý, pizza hải sản...",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Burger bò, burger gà...",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Trà sữa, nước ép, sinh tố...",
      image:
        "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Bánh ngọt, kem, chè...",
      image:
        "https://images.unsplash.com/photo-1530648672449-81f6c723e2f1?crop=entropy&cs=tinrgb&fit=max&fm=jpg&w=400",
    },
    {
      description: "Món chay thanh đạm, bổ dưỡng",
      image:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
  ];

  const getCategoryDesign = (index) =>
    categoryDesigns[index % categoryDesigns.length];

  const normalizeText = (text) =>
    (text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .toLowerCase()
      .trim();

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + "đ";

  const getFoodPrice = (food) => food?.discountPrice || food?.price || 0;

  const getFoodImage = (food) =>
    food?.imageUrl ||
    food?.image ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

  const isComboFood = (food) => {
    const name = normalizeText(food?.name);
    const category = normalizeText(
      food?.categoryName || food?.category?.name || food?.category
    );

    return name.startsWith("combo") || category.includes("combo");
  };

  const isDrinkFood = (food) => {
    const name = normalizeText(food?.name);
    const category = normalizeText(
      food?.categoryName || food?.category?.name || food?.category
    );

    const drinkWords = [
      "do uong",
      "nuoc",
      "tra",
      "tra sua",
      "sinh to",
      "nuoc ep",
      "ca phe",
      "coffee",
      "soda",
      "chanh",
      "cam",
      "dao",
      "vai",
      "matcha",
      "latte",
    ];

    return (
      category.includes("do uong") ||
      category.includes("nuoc") ||
      category.includes("tra") ||
      drinkWords.some((word) => name.includes(word))
    );
  };

  const isDrinkSearch = (value) => {
    const text = normalizeText(value);

    return [
      "nuoc",
      "do uong",
      "thuc uong",
      "tra",
      "tra sua",
      "sinh to",
      "nuoc ep",
      "ca phe",
      "coffee",
    ].some((word) => text.includes(word));
  };

  const getSuggestionScore = (food, searchValue) => {
    const searchText = normalizeText(searchValue);
    const name = normalizeText(food?.name);
    const description = normalizeText(food?.description);
    const category = normalizeText(
      food?.categoryName || food?.category?.name || food?.category
    );

    let score = 0;

    if (name === searchText) score += 1000;
    if (name.startsWith(searchText)) score += 700;
    if (name.includes(searchText)) score += 500;
    if (category.includes(searchText)) score += 300;
    if (description.includes(searchText)) score += 100;

    if (isDrinkSearch(searchValue) && isDrinkFood(food)) {
      score += 700;
    }

    if (isDrinkSearch(searchValue) && isComboFood(food)) {
      score -= 900;
    }

    if (score <= 0) {
      score = 1;
    }

    return score;
  };

  const sortSuggestions = (foods, searchValue) => {
    return [...foods]
      .map((food) => ({
        ...food,
        _suggestionScore: getSuggestionScore(food, searchValue),
      }))
      .sort((a, b) => b._suggestionScore - a._suggestionScore);
  };

  const loadCategories = useCallback(async () => {
    try {
      const res = await foodAPI.getCategories();
      const data = Array.isArray(res.data) ? res.data : [];

      const normalized = data
        .map(normalizeCategory)
        .filter((category) => category.id && category.name)
        .slice(0, 8);

      setCategories(normalized);
    } catch (err) {
      console.error("Lỗi load danh mục home:", err);
      setCategories([]);
    }
  }, []);

  const loadFeaturedFoods = useCallback(async () => {
    try {
      const res = await foodAPI.getFoods({
        available: true,
        sort: "soldDesc",
      });

      const data = Array.isArray(res.data) ? res.data : [];

      setFeaturedFoods(data.slice(0, 8));
    } catch (err) {
      console.error("Lỗi load món nổi bật:", err);
      setFeaturedFoods([]);
    }
  }, []);

  const loadSearchSuggestions = useCallback(async (value) => {
    const searchValue = value.trim();

    if (!searchValue) {
      setSuggestions([]);
      return;
    }

    try {
      setSuggestionLoading(true);

      const res = await foodAPI.getFoods({
        keyword: searchValue,
        search: searchValue,
        available: true,
      });

      const data = Array.isArray(res.data) ? res.data : [];
      const sortedSuggestions = sortSuggestions(data, searchValue);

      setSuggestions(sortedSuggestions.slice(0, 6));
    } catch (error) {
      console.error("Lỗi load gợi ý tìm kiếm:", error);
      setSuggestions([]);
    } finally {
      setSuggestionLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadFeaturedFoods();
  }, [loadCategories, loadFeaturedFoods]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSearchSuggestions(keyword);
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, loadSearchSuggestions]);

  const handleSearch = (eventOrKeyword) => {
    if (eventOrKeyword?.preventDefault) {
      eventOrKeyword.preventDefault();
    }

    const value =
      typeof eventOrKeyword === "string"
        ? eventOrKeyword.trim()
        : keyword.trim();

    if (!value) {
      navigate("/menu");
      return;
    }

    navigate(
      `/menu?keyword=${encodeURIComponent(value)}&search=${encodeURIComponent(
        value
      )}`
    );
  };

  const handleSelectSuggestion = (food) => {
    if (!food?.id) return;

    setKeyword(food.name || "");
    setShowSuggestions(false);
    navigate(`/foods/${food.id}`);
  };

  const openFoodDetailByVoiceKeyword = async (voiceKeyword) => {
    const value = voiceKeyword.trim();

    if (!value) return;

    try {
      const res = await foodAPI.getFoods({
        keyword: value,
        search: value,
        available: true,
      });

      const foods = Array.isArray(res.data) ? res.data : [];

      if (foods.length === 0) {
        alert(`Không tìm thấy món "${value}".`);
        return;
      }

      const searchText = normalizeText(value);
      const sortedFoods = sortSuggestions(foods, value);

      const exactFood =
        sortedFoods.find((food) => normalizeText(food.name) === searchText) ||
        sortedFoods.find((food) => normalizeText(food.name).includes(searchText)) ||
        sortedFoods[0];

      navigate(`/foods/${exactFood.id}`);
    } catch (error) {
      console.error("Lỗi tìm món bằng giọng nói:", error);
      alert("Không thể tìm món ăn bằng giọng nói. Vui lòng thử lại.");
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Trình duyệt chưa hỗ trợ tìm kiếm bằng giọng nói. Vui lòng dùng Chrome hoặc Edge."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setShowSuggestions(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";

      if (!transcript.trim()) return;

      setKeyword(transcript);

      setTimeout(() => {
        openFoodDetailByVoiceKeyword(transcript);
      }, 300);
    };

    recognition.onerror = (event) => {
      console.error("Lỗi tìm kiếm bằng giọng nói:", event.error);
      setIsListening(false);

      if (event.error === "not-allowed") {
        alert("Bạn cần cho phép trình duyệt sử dụng micro.");
      } else {
        alert("Không nhận diện được giọng nói. Vui lòng thử lại.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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
              <span className="hero-eyebrow">
                Giao nhanh · Món tươi · Đặt dễ dàng
              </span>

              <h1>
                Đặt món ngon dễ dàng cùng <span>NLU FoodStack</span>
              </h1>

              <p>
                Khám phá hàng trăm món ăn hấp dẫn, đặt hàng nhanh chóng và giao
                tận nơi.
              </p>

              <form
                className="hero-search"
                onSubmit={handleSearch}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 180);
                }}
              >
                <span className="hero-search-icon">🔎</span>

                <input
                  type="text"
                  placeholder="Tìm món ăn yêu thích..."
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value);
                    setShowSuggestions(true);
                  }}
                />

                {keyword && (
                  <button
                    type="button"
                    className="hero-clear-search"
                    onClick={() => {
                      setKeyword("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    title="Xóa từ khóa"
                  >
                    ×
                  </button>
                )}

                <button
                  type="button"
                  className={`hero-voice-btn ${isListening ? "listening" : ""}`}
                  onClick={handleVoiceSearch}
                  title="Tìm kiếm bằng giọng nói"
                >
                  {isListening ? "🎙️" : "🎤"}
                </button>

                {showSuggestions && keyword.trim() && (
                  <div className="hero-search-suggestions">
                    {suggestionLoading ? (
                      <div className="hero-suggestion-empty">
                        Đang tìm món phù hợp...
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="hero-suggestion-empty">
                        Không tìm thấy món phù hợp
                      </div>
                    ) : (
                      suggestions.map((food) => (
                        <button
                          type="button"
                          key={food.id}
                          className="hero-suggestion-item"
                          onMouseDown={() => handleSelectSuggestion(food)}
                        >
                          <img
                            src={getFoodImage(food)}
                            alt={food.name || "Món ăn"}
                            onError={(event) => {
                              event.currentTarget.src =
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";
                            }}
                          />

                          <div>
                            <strong>{food.name}</strong>
                            <span>
                              {food.categoryName || "Món ăn"} ·{" "}
                              {formatMoney(getFoodPrice(food))}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </form>

              <div className="hero-actions">
                <button
                  type="button"
                  className="hero-primary-btn"
                  onClick={() => handleSearch()}
                >
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
          <div className="benefit-card">
            <span>🛵</span>
            <div>
              <strong>Giao hàng nhanh</strong>
              <p>Nhận món nóng trong khoảng 30 phút</p>
            </div>
          </div>

          <div className="benefit-card">
            <span>🥗</span>
            <div>
              <strong>Nguyên liệu tươi</strong>
              <p>Lựa chọn món ngon mỗi ngày</p>
            </div>
          </div>

          <div className="benefit-card">
            <span>💳</span>
            <div>
              <strong>Thanh toán tiện lợi</strong>
              <p>COD hoặc VNPAY an toàn</p>
            </div>
          </div>

          <div className="benefit-card">
            <span>💬</span>
            <div>
              <strong>Hỗ trợ tận tâm</strong>
              <p>Luôn sẵn sàng giải đáp</p>
            </div>
          </div>
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
            <span className="home-section-eyebrow">
              Khám phá theo khẩu vị
            </span>
            <h2>Danh mục món ăn</h2>
            <p>Khám phá đa dạng món ăn từ nhiều ẩm thực</p>
          </div>

          <div className="categories-grid">
            {categories.length === 0 ? (
              <div className="home-empty-card">Chưa có danh mục món ăn.</div>
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
                  categoryName:
                    food.categoryName ??
                    (food.category && food.category.name) ??
                    food.category,
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

              <p>
                Khám phá thực đơn phong phú, ưu đãi hấp dẫn và giao hàng nhanh
                chóng tới tận nơi.
              </p>

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
              <img
                src="https://images.unsplash.com/photo-1600891964599-f61ba0e24092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900"
                alt="Đặt món"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;