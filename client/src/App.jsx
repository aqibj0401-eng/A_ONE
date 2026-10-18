import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { trackEvent } from './utils/behaviorTracker';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminDashboard from './pages/AdminDashboard';
import CustomerTimeline from './pages/CustomerTimeline';
import Footer from './components/Footer';

// Landing Page Component
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#fcfcfc] border border-gray-400 p-8 md:p-12 text-center">
        <h1 className="text-4xl font-serif font-medium tracking-tight text-[#111111] mb-6">
          A-ONE MOBILE & LAPTOP
        </h1>
        <p className="text-gray-500 mb-10 text-sm tracking-wide">
          Shop smartphones and laptops, explore product details, and share your shopping experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login" className="px-8 py-3 bg-[#111111] text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-8 py-3 bg-transparent border border-gray-400 text-[#111111] text-sm font-medium hover:border-black transition-colors">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

// Component to track page views
const PageTracker = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      trackEvent('page_view', { path: location.pathname });
    }
  }, [location, isAuthenticated]);

  return null; // Doesn't render anything
};

function App() {
  return (
    <Router>
      <PageTracker />
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
            
            {/* Protected Routes (Admin Only) */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/customers/:userId" element={<CustomerTimeline />} />
            </Route>
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
