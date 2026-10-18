import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { trackEvent } from '../utils/behaviorTracker';
import api from '../services/api';
import { 
  ArrowLeft, ShieldCheck, Truck, CreditCard, 
  ShoppingBag, Lock, CheckCircle2, AlertCircle, Tag, DollarSign,
  Sparkles
} from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Form states
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: 'Street 4, Sector F-7',
    city: 'Islamabad',
    postalCode: '44000',
    country: 'Pakistan',
  });

  const [shippingMethod, setShippingMethod] = useState('standard'); // 'standard' | 'express'
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'cod'
  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  
  // Card demo constants
  const cardNumber = '4242 •••• •••• 4242';
  const cardExpiry = '12/28';
  const cardCvc = '888';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Track checkout initiation
  useEffect(() => {
    if (items.length > 0) {
      trackEvent('checkout_start', {
        cartTotal: total,
        itemsCount: totalItems,
        items: items.map(i => ({ id: i._id, name: i.name, qty: i.quantity }))
      });
    }
  }, []);

  // Update formData when user loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const shippingFee = shippingMethod === 'express' ? 15.00 : 0.00;
  const discountAmount = (total * discountPercent) / 100;
  const finalTotal = Math.max(0, total - discountAmount + shippingFee);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'FYP2026' || code === 'DEMO10' || code === 'EXAMINER') {
      setDiscountPercent(15);
      setPromoMessage('15% Academic Demonstration Discount Applied!');
    } else if (code) {
      setPromoMessage('Invalid promo code. Try "FYP2026" or "DEMO10"');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    if (!formData.fullName || !formData.email || !formData.address || !formData.city) {
      setError('Please fill in all required shipping fields.');
      return;
    }

    setLoading(true);

    try {
      const sessionId = sessionStorage.getItem('analytics_session_id');

      const payload = {
        customerInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || '+92 300 1234567',
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        items: items.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || ''
        })),
        subtotal: Number(total.toFixed(2)),
        shippingFee: Number(shippingFee.toFixed(2)),
        tax: 0,
        totalAmount: Number(finalTotal.toFixed(2)),
        paymentMethod: paymentMethod === 'card' 
          ? 'Demo Visa (Ending in 4242)' 
          : 'Cash on Delivery (Demo)',
        sessionId,
      };

      const res = await api.post('/orders', payload);

      if (res.data?.success && res.data?.order) {
        // Clear cart
        clearCart();
        // Redirect to order confirmation page
        navigate(`/order-confirmation/${res.data.order._id}`, {
          state: { order: res.data.order }
        });
      } else {
        setError('Failed to place order. Please try again.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Server error processing checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] text-[#111111] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#fcfcfc] border border-gray-300 p-8 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 mx-auto text-gray-400" />
          <h2 className="text-2xl font-serif font-medium">Your Cart is Empty</h2>
          <p className="text-sm text-gray-500">
            Add items to your cart from our collection before proceeding to checkout.
          </p>
          <Link
            to="/products"
            className="inline-block mt-4 px-6 py-3 bg-[#111111] text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      {/* Top Banner for FYP Examiner Demo */}
      <div className="bg-[#111111] text-white py-2 px-4 text-xs font-mono text-center tracking-wider flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>ACADEMIC FYP DEMO MODE — SIMULATED PAYMENT • DATABASE RECORDING ACTIVE</span>
      </div>

      {/* Navigation Header */}
      <header className="border-b border-gray-200 py-6 px-6 md:px-12 bg-[#fcfcfc]">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between">
          <Link 
            to="/products" 
            className="inline-flex items-center text-sm font-medium hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
          </Link>

          <Link to="/" className="font-serif text-3xl font-medium tracking-tight">
            A-ONE MOBILE & LAPTOP
          </Link>

          <div className="flex items-center text-xs text-gray-500 gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-700" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Grid */}
      <main className="max-w-[1300px] mx-auto px-6 md:px-12 py-10 md:py-14">
        {error && (
          <div className="mb-8 border border-red-500 bg-red-50 text-red-600 px-5 py-4 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* LEFT COLUMN: Shipping & Payment Details */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* User status card */}
            <div className="p-4 bg-[#f4f4f4] border border-gray-300 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Account</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {isAuthenticated ? (
                    <span>Logged in as <strong className="font-semibold">{user?.name}</strong> ({user?.email})</span>
                  ) : (
                    <span>Checking out as Guest</span>
                  )}
                </p>
              </div>
              {isAuthenticated ? (
                <span className="text-[10px] font-mono uppercase bg-black text-white px-2 py-0.5 tracking-wider">
                  Verified User
                </span>
              ) : (
                <Link to="/login" className="text-xs font-medium underline underline-offset-4 hover:text-black">
                  Sign In
                </Link>
              )}
            </div>

            {/* SECTION 1: Shipping Address */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-300 pb-3">
                <h2 className="text-xl font-serif font-medium">1. Shipping Information</h2>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Asad Ali"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 focus:border-black focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="asad@example.com"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 focus:border-black focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 focus:border-black focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-1.5">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House / Apartment, Street, Area"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 focus:border-black focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Islamabad / Lahore / Karachi"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 focus:border-black focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-gray-700 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="44000"
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 focus:border-black focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 2: Delivery Method */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-300 pb-3">
                <h2 className="text-xl font-serif font-medium">2. Delivery Speed</h2>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Step 2 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label 
                  onClick={() => setShippingMethod('standard')}
                  className={`border p-4 cursor-pointer flex flex-col justify-between transition-all ${
                    shippingMethod === 'standard' 
                      ? 'border-black bg-white ring-1 ring-black' 
                      : 'border-gray-300 hover:border-gray-400 bg-[#f9f9f9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Standard Delivery
                    </span>
                    <span className="text-xs font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5">Free</span>
                  </div>
                  <p className="text-xs text-gray-500">Estimated 3–5 business days</p>
                </label>

                <label 
                  onClick={() => setShippingMethod('express')}
                  className={`border p-4 cursor-pointer flex flex-col justify-between transition-all ${
                    shippingMethod === 'express' 
                      ? 'border-black bg-white ring-1 ring-black' 
                      : 'border-gray-300 hover:border-gray-400 bg-[#f9f9f9]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold flex items-center gap-2">
                      <Truck className="w-4 h-4" /> Express Courier
                    </span>
                    <span className="text-xs font-bold">$15.00</span>
                  </div>
                  <p className="text-xs text-gray-500">Guaranteed 1–2 business days</p>
                </label>
              </div>
            </section>

            {/* SECTION 3: Payment Method (Demonstration Sandbox) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-300 pb-3">
                <h2 className="text-xl font-serif font-medium">3. Payment Method</h2>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Step 3 of 3</span>
              </div>

              {/* Payment selector tabs */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border flex items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'card' 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-300 bg-white text-gray-700 hover:border-black'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Demo Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border flex items-center justify-center gap-2 transition-colors ${
                    paymentMethod === 'cod' 
                      ? 'border-black bg-black text-white' 
                      : 'border-gray-300 bg-white text-gray-700 hover:border-black'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Cash on Delivery
                </button>
              </div>

              {/* Payment details container */}
              {paymentMethod === 'card' ? (
                <div className="bg-[#f7f7f7] border border-gray-300 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Simulated Card Details</span>
                    <span className="text-[10px] font-mono uppercase bg-emerald-600 text-white px-2 py-0.5">Pre-filled Demo</span>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-600 mb-1">Card Number</label>
                    <input
                      type="text"
                      readOnly
                      value={cardNumber}
                      className="w-full px-3 py-2 bg-white border border-gray-300 font-mono text-sm text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-gray-600 mb-1">Expires</label>
                      <input
                        type="text"
                        readOnly
                        value={cardExpiry}
                        className="w-full px-3 py-2 bg-white border border-gray-300 font-mono text-sm text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-gray-600 mb-1">CVC / CVV</label>
                      <input
                        type="text"
                        readOnly
                        value={cardCvc}
                        className="w-full px-3 py-2 bg-white border border-gray-300 font-mono text-sm text-gray-800"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Examiner Notice: No credit card charges will occur. Order is saved straight into MongoDB.
                  </p>
                </div>
              ) : (
                <div className="bg-[#f7f7f7] border border-gray-300 p-6 space-y-2">
                  <p className="text-sm font-medium text-gray-900">Cash on Delivery (Simulated)</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Pay upon receipt of package at your specified delivery address. Order record will be generated immediately.
                  </p>
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: Sticky Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 bg-white border border-gray-300 p-6 md:p-8 space-y-6">
              
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <h3 className="text-xl font-serif font-medium">Order Summary</h3>
                <span className="text-xs text-gray-500">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-2 space-y-3">
                {items.map((item) => (
                  <div key={item._id} className="pt-3 first:pt-0 flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#f2f2f2] border border-gray-200 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-full h-full object-cover mix-blend-multiply"
                      />
                      <span className="absolute bottom-0 right-0 bg-black text-white text-[10px] px-1 font-mono">
                        x{item.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>

                    <div className="text-sm font-bold font-mono">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Promo code (e.g. FYP2026)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-transparent border border-gray-300 text-xs uppercase tracking-wider focus:border-black focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-[#f2f2f2] border border-gray-300 hover:bg-black hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs mt-2 ${discountPercent > 0 ? 'text-emerald-600 font-medium' : 'text-red-500'}`}>
                    {promoMessage}
                  </p>
                )}
              </div>

              {/* Price Calculations */}
              <div className="border-t border-gray-200 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({discountPercent}%)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-mono">{shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax</span>
                  <span className="font-mono">$0.00</span>
                </div>

                <div className="border-t border-gray-300 pt-3 flex justify-between text-lg font-serif font-medium text-gray-900">
                  <span>Total</span>
                  <span className="font-mono font-bold text-xl">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* CTA Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#111111] hover:bg-gray-800 text-white font-medium text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing Demo Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Order (${finalTotal.toFixed(2)})</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-gray-400 space-y-1">
                <p>🔒 256-Bit SSL Demo Sandbox Environment</p>
                <p>Order and customer behavior event will be logged in database</p>
              </div>

            </div>
          </div>

        </form>
      </main>
    </div>
  );
};

export default Checkout;
