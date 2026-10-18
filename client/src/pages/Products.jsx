import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Search, ShoppingBag, ShoppingCart, SlidersHorizontal, ArrowDownUp, X } from 'lucide-react';
import { trackEvent } from '../utils/behaviorTracker';
import CartSidebar from '../components/CartSidebar';

const Products = () => {
  const { products, fetchProducts, isLoading, error } = useProductStore();
  const { user, logout } = useAuthStore();
  const { items, addToCart } = useCartStore();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white">
      
      {/* Minimal Header */}
      <nav className="py-6 px-6 md:px-12 flex justify-between items-center bg-[#fcfcfc] z-10 relative">
        <div className="w-1/3 flex items-center">
           {/* Empty left side to balance logo */}
        </div>
        <div className="w-1/3 text-center">
          <Link to="/" className="font-serif text-4xl md:text-5xl font-medium tracking-tight hover:opacity-80 transition-opacity">A-ONE MOBILE & LAPTOP</Link>
        </div>
        <div className="w-1/3 flex justify-end items-center space-x-4 md:space-x-6">
          <div className="relative flex items-center">
             {isSearchOpen && (
               <input 
                 type="text" 
                 autoFocus
                 placeholder="Search products..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="absolute right-8 w-32 md:w-48 border-b border-gray-300 bg-transparent text-sm pb-1 outline-none focus:border-black transition-colors"
               />
             )}
             <button onClick={() => {
                if(isSearchOpen && searchQuery) setSearchQuery('');
                setIsSearchOpen(!isSearchOpen);
             }} className="hover:opacity-70 transition-opacity z-10 bg-[#fcfcfc] pl-2">
               {isSearchOpen && !searchQuery ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
             </button>
          </div>
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

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 md:px-12 py-10 md:py-16">
        {isLoading ? (
          <div className="text-center py-20 font-mono tracking-widest uppercase text-gray-500">Loading catalog...</div>
        ) : error ? (
          <div className="border border-black p-4 font-bold uppercase text-red-600">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 font-medium text-gray-500">
            No products found. (Run the seed script to populate data!)
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32">
             <h3 className="text-2xl font-serif font-medium mb-2">No products found</h3>
             <p className="text-gray-500">We couldn't find anything matching "{searchQuery}".</p>
             <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="mt-6 text-sm font-medium underline underline-offset-4 hover:text-gray-500 transition-colors">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-12">
            {filteredProducts.map((product) => (
                <div key={product._id} className="group relative">
                   {/* Image Box */}
                   <div 
                      onClick={() => navigate(`/products/${product._id}`)}
                      className="block relative bg-[#f2f2f2] border border-gray-400 aspect-[4/5] mb-4 overflow-hidden cursor-pointer"
                   >
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
                      />
                   </div>
                   
                   {/* Title & Price Below Image */}
                   <div className="flex justify-between items-start gap-4 px-1">
                      <h4 
                        onClick={() => navigate(`/products/${product._id}`)}
                        className="text-base font-medium text-gray-900 cursor-pointer hover:underline"
                      >
                        {product.name}
                      </h4>
                      <span className="text-base font-bold text-gray-900 whitespace-nowrap">
                        ${product.price.toFixed(0)}
                      </span>
                   </div>
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       addToCart(product);
                       setIsCartOpen(true);
                     }}
                     className="mt-3 w-full py-2 bg-transparent border border-black text-xs font-medium uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                   >
                     Add to Bag
                   </button>
                </div>
             ))}
          </div>
        )}
      </main>
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Products;
