import '../App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomePage from '../pages/customer/HomePage';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import ScrollToTop from '../components/common/ScrollToTop';
import FoodDetailPage from '../pages/customer/FoodDetailPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import CartPage from '../pages/customer/CartPage';
import CheckoutPage from '../pages/customer/CheckoutPage';
import ChatPage from '../pages/customer/ChatPage';
import MenuPage from '../pages/customer/MenuPage';
import OrderDetailPage from '../pages/customer/OrderDetailPage';
import OrderHistoryPage from '../pages/customer/OrderHistoryPage';
import ProfilePage from '../pages/customer/ProfilePage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminFoodManagement from '../pages/admin/AdminFoodManagement';
import AdminOrderManagement from '../pages/admin/AdminOrderManagement';
import AdminUserManagement from '../pages/admin/AdminUserManagement';
import AdminChatManagement from '../pages/admin/AdminChatManagement';
import AdminStatistics from '../pages/admin/AdminStatistics';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
            <ScrollToTop />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route path="/home" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/foods/:id" element={<FoodDetailPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/orders" element={<OrderHistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/foods" element={<AdminFoodManagement />} />
            <Route path="/admin/orders" element={<AdminOrderManagement />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/chat" element={<AdminChatManagement />} />
            <Route path="/admin/statistics" element={<AdminStatistics />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={2500}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            pauseOnHover
            draggable
            theme="colored"
          />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;