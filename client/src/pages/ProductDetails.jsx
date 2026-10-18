import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { ArrowLeft, Search, ShoppingBag, Plus, Minus } from 'lucide-react';
import { trackEvent } from '../utils/behaviorTracker';
import FeedbackModal from '../components/FeedbackModal';
import CartSidebar from '../components/CartSidebar';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-4 text-sm font-medium hover:opacity-70 transition-opacity"
      >
        {title}
        <span>{isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
      </button>
      {isOpen && (
        <div className="pb-4 text-sm leading-relaxed text-gray-600">
          {children}
        </div>
      )}
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const { product, fetchProductById, products, fetchProducts, isLoading, error } = useProductStore();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { items, addToCart } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    fetchProductById(id);
    fetchProducts();
  }, [id, fetchProductById, fetchProducts]);

  // Track product view
  useEffect(() => {
    if (product && product._id === id) {
      trackEvent('product_view', { 
        productId: product._id, 
        productName: product.name,
        category: product.category 
      });
    }
  }, [product, id]);

  const handleAddToCart = () => {
    trackEvent('add_to_cart', { productId: product._id, quantity });
    
    // Add multiple times to match quantity
    for(let i = 0; i < quantity; i++) {
        addToCart(product);
    }
    
    setAddedToCart(true);
    setIsCartOpen(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (isLoading) {
    return <div className="text-center py-20 font-mono tracking-widest uppercase text-gray-500 min-h-screen bg-[#fcfcfc]">Loading...</div>;
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center bg-[#fcfcfc] min-h-screen">
        <div className="text-red-600 mb-4">{error || 'Product not found'}</div>
        <Link to="/products" className="inline-flex items-center hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-24">
      
      {/* Minimal Header (Matches Products.jsx) */}
      <nav className="py-6 px-6 md:px-12 flex justify-between items-center bg-[#fcfcfc] z-10 relative">
        <div className="w-1/3 flex items-center">
           {/* Empty left side to balance logo */}
        </div>
        <div className="w-1/3 text-center">
          <Link to="/" className="font-serif text-4xl md:text-5xl font-medium tracking-tight hover:opacity-80 transition-opacity">A-ONE MOBILE & LAPTOP</Link>
        </div>
        <div className="w-1/3 flex justify-end items-center space-x-6">
          <button className="hover:opacity-70 transition-opacity hidden md:block"><Search className="w-5 h-5" /></button>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative hover:opacity-70 transition-opacity"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartItemsCount}
              </span>
            )}
          </button>
          
          {user ? (
            <div className="hidden md:flex items-center space-x-5 text-sm font-medium">
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:underline underline-offset-4">Admin</Link>
              )}
              <button onClick={logout} className="hover:underline underline-offset-4">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block text-sm font-medium hover:underline underline-offset-4">Sign In</Link>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto px-6 md:px-12 mt-8 md:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        
        {/* Left Side: Image Container */}
        <div className="bg-[#f2f2f2] border border-gray-400 aspect-[3/4] relative flex items-center justify-center p-8 overflow-hidden">
          <img 
            src={product.image} 
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover mix-blend-multiply" 
          />
        </div>

        {/* Right Side: Product Info */}
        <div className="flex flex-col pt-4 lg:pt-12">
          
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
             <Link to="/" className="hover:text-black hover:underline underline-offset-4">Home</Link>
             <span>/</span>
             <Link to="/products" className="hover:text-black hover:underline underline-offset-4">Catalog</Link>
             <span>/</span>
             <span className="text-black">{product.category}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-4">
            {product.name}
          </h1>
          
          <div className="text-2xl font-medium mb-10">
            ${(product.price * quantity).toFixed(2)}
          </div>
          
          {/* Cart Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            {/* Quantity */}
            <div className="flex items-center border border-gray-300 w-full sm:w-auto h-12">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 h-full hover:bg-gray-100 transition-colors">-</button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 h-full hover:bg-gray-100 transition-colors">+</button>
            </div>
            
            {/* Add to Cart Button */}
            <button 
               onClick={handleAddToCart}
               className="flex-1 w-full bg-[#0a0a0a] text-white h-12 font-medium tracking-wide hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
               {addedToCart ? 'Added ✓' : 'Add to Bag'}
            </button>
          </div>
          
          {/* Description */}
          <div className="text-sm leading-relaxed text-gray-700 mb-10">
            <p>{product.description}</p>
          </div>
          
          {/* Accordions */}
          <div className="flex flex-col">
            <AccordionItem title="Details" defaultOpen={true}>
              Use daily for best results. Apply a small amount and massage gently. Avoid contact with eyes. Formulated with premium natural extracts.
            </AccordionItem>
            <AccordionItem title="Shipping & Returns">
               Free standard shipping on orders over $50. Returns accepted within 30 days of delivery.
            </AccordionItem>
            <AccordionItem title="Feedback & Rating">
               <div className="text-gray-600">
                 Read what others are saying about this product. Over 90% of our customers would recommend this item!
               </div>
            </AccordionItem>
          </div>

          {/* Feedback Section Moved Out */}
          <div className="mt-8 border-t border-gray-200 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
             <div>
                <div className="text-sm text-gray-500 mb-1">Customer Reviews</div>
                <div className="flex items-center gap-2">
                   <span className="text-3xl font-serif font-medium">{product.rating.toFixed(1)}</span>
                   <span className="text-yellow-500 text-xl -mt-1">★</span>
                </div>
             </div>
             <button 
               onClick={() => {
                 if (user) {
                   setIsFeedbackOpen(true);
                 } else {
                   navigate('/login');
                 }
               }} 
               className="w-full sm:w-auto px-8 py-3 border border-[#0a0a0a] text-sm font-medium hover:bg-[#0a0a0a] hover:text-white transition-colors"
             >
               Leave Feedback
             </button>
          </div>
        </div>
      </main>

      {/* Recommendations Section */}
      {products && products.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 md:px-12 mt-24 md:mt-32">
          <h2 className="text-2xl md:text-3xl font-serif font-medium mb-8 md:mb-10">You Might Also Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {products
              .filter(p => p._id !== id)
              .sort(() => 0.5 - Math.random()) // Shuffle for variety
              .slice(0, 3)
              .map(rec => (
              <div key={rec._id} className="group cursor-pointer" onClick={() => navigate(`/products/${rec._id}`)}>
                <div className="bg-[#f2f2f2] border border-gray-300 aspect-[3/4] mb-4 overflow-hidden relative">
                   <img 
                     src={rec.image} 
                     alt={rec.name} 
                     onError={(e) => {
                       e.currentTarget.onerror = null;
                       e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                     }}
                     className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700" 
                   />
                </div>
                <div className="flex justify-between items-start gap-4 px-1">
                   <h4 className="text-sm font-medium text-gray-900 group-hover:underline">{rec.name}</h4>
                   <span className="text-sm font-bold whitespace-nowrap">${rec.price.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        productId={product._id} 
      />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default ProductDetails;
