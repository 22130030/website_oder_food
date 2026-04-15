import '../App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/customer/HomePage';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import FoodDetailPage from '../pages/customer/FoodDetailPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/food/:id" element={<FoodDetailPage />} />
        </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
