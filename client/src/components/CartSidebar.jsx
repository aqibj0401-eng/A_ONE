import { useCartStore } from '../store/cartStore';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartSidebar = ({ isOpen, onClose }) => {
  const { items, removeFromCart, clearCart } = useCartStore();
  const navigate = useNavigate();

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#fcfcfc] shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-200">
          <h2 className="text-xl font-serif font-medium flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Your Cart ({totalItems})
          </h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-black transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <ShoppingBag className="w-12 h-12 opacity-20" />
              <p>Your cart is empty</p>
              <button 
                onClick={onClose}
                className="mt-4 text-sm font-medium underline underline-offset-4 hover:text-black transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <div 
                    className="w-20 h-24 bg-[#f2f2f2] border border-gray-300 flex-shrink-0 cursor-pointer"
                    onClick={() => {
                      onClose();
                      navigate(`/products/${item._id}`);
                    }}
                  >
                    <img 
                      src={item.image} 
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:underline"
                          onClick={() => {
                            onClose();
                            navigate(`/products/${item._id}`);
                          }}
                        >
                          {item.name}
                        </h3>
                        <p className="text-sm font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item._id)}
                      className="text-xs font-medium text-red-600 hover:text-red-500 self-start flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
              <p>Subtotal</p>
              <p>${total.toFixed(2)}</p>
            </div>
            <p className="text-xs text-gray-500 mb-6">
              Shipping and taxes calculated at checkout.
            </p>
            <div className="space-y-3">
              <button
                className="w-full bg-[#111111] text-white py-3 px-4 text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => {
                  onClose();
                  navigate('/checkout');
                }}
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => clearCart()}
                className="w-full bg-transparent border border-gray-400 py-3 px-4 text-sm font-medium hover:border-black transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
