import React, { createContext, useContext, useMemo, useState } from 'react';

// ==================== CART CONTEXT ====================

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

// ==================== CART PROVIDER ====================

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // ==================== ADD TO CART ====================

  const addToCart = (food) => {
    setCartItems((prev) => {
      const existed = prev.find((item) => item.id === food.id);

      if (existed) {
        return prev.map((item) =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...food, quantity: 1 }];
    });
  };

  // ==================== UPDATE QUANTITY ====================

  const updateQuantity = (foodId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(foodId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === foodId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  // ==================== DECREASE ITEM ====================

  const decreaseItem = (foodId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === foodId
            ? { ...item, quantity: Math.max(0, item.quantity - 1) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ==================== REMOVE FROM CART ====================

  const removeFromCart = (foodId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== foodId));
  };

  // ==================== CLEAR CART ====================

  const clearCart = () => {
    setCartItems([]);
  };

  // ==================== CALCULATED VALUES ====================

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.length;
  }, [cartItems]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  // ==================== CONTEXT VALUE ====================

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    decreaseItem,
    removeFromCart,
    clearCart,
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