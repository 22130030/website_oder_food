import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const getUserId = () => {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return null;

    const user = JSON.parse(userRaw);
    return user.id || user.userId || user.accountId;
  };

  const normalizeCartItem = (item) => {
    const food = item.foodItem || item.food || item;

    return {
      id: food.id || item.foodItemId,
      foodItemId: food.id || item.foodItemId,
      name: food.name,
      price: food.discountPrice || food.price || 0,
      imageUrl: food.imageUrl,
      description: food.description,
      quantity: item.quantity || 1,
      note: item.note || '',
    };
  };

  const loadCartFromDatabase = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await axios.get(`http://localhost:8080/api/cart?userId=${userId}`);

      const data = Array.isArray(res.data) ? res.data : [];
      setCartItems(data.map(normalizeCartItem));
    } catch (error) {
      console.error('Lỗi load giỏ hàng từ database:', error);
    }
  }, []);

  useEffect(() => {
    loadCartFromDatabase();
  }, [loadCartFromDatabase]);

  const addToCart = async (food, quantity = 1) => {
    const userId = getUserId();

    if (!userId) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }

    try {
      await axios.post(
        `http://localhost:8080/api/cart/add?userId=${userId}`,
        {
          foodItemId: food.id || food.foodItemId,
          quantity,
          note: '',
        }
      );

      await loadCartFromDatabase();

      toast.success('Đã thêm món vào giỏ hàng!');
    } catch (error) {
      console.error('Lỗi thêm giỏ hàng:', error);
      toast.error('Không thể thêm vào giỏ hàng');
    }
  };

  const updateQuantity = async (foodId, newQuantity) => {
  const userId = getUserId();

  if (!userId) {
    toast.warning('Vui lòng đăng nhập');
    return;
  }

  if (newQuantity <= 0) {
    await removeFromCart(foodId);
    return;
  }

  // Cập nhật giao diện trước cho mượt
  setCartItems((prev) =>
    prev.map((item) =>
      item.id === foodId ? { ...item, quantity: newQuantity } : item
    )
  );

  try {
    await axios.put(
      `http://localhost:8080/api/cart/${foodId}?userId=${userId}`,
      {
        quantity: newQuantity,
      }
    );

    await loadCartFromDatabase();
  } catch (error) {
    console.error('Lỗi cập nhật số lượng giỏ hàng:', error);
    toast.error('Không thể cập nhật số lượng món');
    await loadCartFromDatabase();
  }
};

  const decreaseItem = async (foodId) => {
  const item = cartItems.find((cartItem) => cartItem.id === foodId);

  if (!item) return;

  await updateQuantity(foodId, item.quantity - 1);
};

  const removeFromCart = async (foodId) => {
  const userId = getUserId();

  if (!userId) {
    toast.warning('Vui lòng đăng nhập');
    return;
  }

  try {
    await axios.delete(
      `http://localhost:8080/api/cart/${foodId}?userId=${userId}`
    );

    setCartItems((prev) => prev.filter((item) => item.id !== foodId));

    toast.success('Đã xóa món khỏi giỏ hàng');
  } catch (error) {
    console.error('Lỗi xóa món khỏi giỏ:', error);
    toast.error('Không thể xóa món khỏi giỏ hàng');
  }
};

  const clearCart = async () => {
  const userId = getUserId();

  setCartItems([]);

  if (!userId) return;

  try {
    await axios.delete(`http://localhost:8080/api/cart/clear?userId=${userId}`);
  } catch (error) {
    console.error('Lỗi xóa toàn bộ giỏ hàng:', error);
  }
};

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.length;
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0
    );
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    decreaseItem,
    removeFromCart,
    clearCart,
    loadCartFromDatabase,
    totalQuantity,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};