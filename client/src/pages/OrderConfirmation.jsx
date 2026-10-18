import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  CheckCircle2, Printer, Sparkles, UserCheck 
} from 'lucide-react';

const OrderConfirmation = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuthStore();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          const res = await api.get(`/orders/${id}`);
          setOrder(res.data);
        } catch (err) {
          setError('Failed to load order details.');
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, order]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-mono text-sm tracking-widest uppercase text-gray-500">
        Loading Order Confirmation...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
        <Link to="/products" className="px-6 py-2.5 bg-black text-white text-sm">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white py-12 md:py-16">
      
      {/* Top Banner */}
      <div className="max-w-[900px] mx-auto px-6 mb-8 print:hidden">
        <div className="bg-[#111111] text-white p-4 border border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-mono uppercase tracking-widest font-bold">FYP Examiner Verification</p>
              <p className="text-xs text-gray-300">
                Order record stored in MongoDB and tracked in Customer Intelligence Timeline.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {order.userId && (
              <Link
                to={`/admin/customers/${order.userId._id || order.userId}`}
                className="text-xs bg-white text-black font-semibold px-3 py-1.5 hover:bg-gray-200 transition-colors inline-flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                View Customer 360
              </Link>
            )}
            <button
              onClick={handlePrint}
              className="text-xs border border-gray-500 text-white px-3 py-1.5 hover:border-white transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-6">
        
        {/* Main Card */}
        <div className="bg-white border border-gray-400 p-8 md:p-12 shadow-sm">
          
          {/* Header */}
          <div className="text-center pb-10 border-b border-gray-200">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>

            <p className="text-xs uppercase font-mono tracking-widest text-emerald-700 font-bold mb-2">
              Payment & Checkout Simulated
            </p>
            
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
              Order Confirmed!
            </h1>

            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto">
              Thank you, <strong className="text-gray-900">{order.customerInfo?.fullName}</strong>. Your order has been placed and saved into the database.
            </p>

            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
              <span className="font-mono text-sm bg-[#f2f2f2] border border-gray-300 px-3 py-1.5 font-bold">
                {order.orderNumber}
              </span>
              <span className="text-xs font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 uppercase font-medium">
                Status: {order.orderStatus || 'Confirmed'}
              </span>
              <span className="text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 uppercase font-medium">
                {order.paymentMethod}
              </span>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-b border-gray-200 text-xs">
            <div>
              <p className="uppercase tracking-widest text-gray-500 font-bold mb-1">Date Placed</p>
              <p className="text-gray-900 font-medium">{orderDate}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-gray-500 font-bold mb-1">Shipping To</p>
              <p className="text-gray-900 font-medium leading-relaxed">
                {order.customerInfo?.address}, {order.customerInfo?.city}
                {order.customerInfo?.postalCode ? ` - ${order.customerInfo.postalCode}` : ''}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-gray-500 font-bold mb-1">Estimated Delivery</p>
              <p className="text-gray-900 font-medium">3–5 Business Days</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-8 border-b border-gray-200">
            <h3 className="text-base font-serif font-medium mb-6">Purchased Items</h3>

            <div className="space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#f5f5f5] border border-gray-200 flex-shrink-0 overflow-hidden">
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
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="text-sm font-bold font-mono">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="py-8 border-b border-gray-200">
            <div className="max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">${order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-mono">{order.shippingFee === 0 ? 'Free' : `$${order.shippingFee?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span className="font-mono">$0.00</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between font-serif font-bold text-lg text-gray-900">
                <span>Total Paid</span>
                <span className="font-mono text-xl">${order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            <Link
              to="/products"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#111111] hover:bg-gray-800 text-white text-xs font-semibold uppercase tracking-widest transition-colors text-center"
            >
              Continue Shopping
            </Link>

            {user?.role === 'admin' ? (
              <Link
                to="/admin"
                className="w-full sm:w-auto px-6 py-3.5 border border-black hover:bg-black hover:text-white text-xs font-semibold uppercase tracking-widest transition-colors text-center"
              >
                Go to Admin Dashboard
              </Link>
            ) : (
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto px-6 py-3.5 border border-gray-400 hover:border-black text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderConfirmation;
