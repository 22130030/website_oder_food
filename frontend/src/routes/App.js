import '../App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/customer/HomePage';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import FoodDetailPage from '../pages/customer/FoodDetailPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import ChatPage from '../pages/customer/ChatPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route path="/home" element={<HomePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/food/:id" element={<FoodDetailPage />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
