import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, User, Clock, Eye, MousePointerClick, 
  ShoppingCart, MessageSquare, LogIn, LogOut, FileText,
  ChevronDown, ChevronUp, PackageCheck, CreditCard
} from 'lucide-react';

const SENTIMENT_STYLES = {
  'Positive': 'border-[#111111]',
  'Neutral': 'border-gray-400 text-gray-500',
  'Negative': 'border-red-500 text-red-600',
  'Pending': 'border-gray-400 text-gray-400'
};

const getEventIcon = (eventType) => {
  switch (eventType) {
    case 'page_view': return <FileText className="w-4 h-4 text-gray-600" />;
    case 'product_view': return <Eye className="w-4 h-4 text-gray-800" />;
    case 'product_click': return <MousePointerClick className="w-4 h-4 text-gray-900" />;
    case 'add_to_cart': return <ShoppingCart className="w-4 h-4 text-black" />;
    case 'feedback_submitted': return <MessageSquare className="w-4 h-4 text-black" />;
    case 'login': return <LogIn className="w-4 h-4 text-gray-600" />;
    case 'logout': return <LogOut className="w-4 h-4 text-gray-400" />;
    case 'checkout_start': return <CreditCard className="w-4 h-4 text-gray-800" />;
    case 'checkout_completed':
    case 'order': return <PackageCheck className="w-4 h-4 text-emerald-600" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const CustomerTimeline = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSessions, setExpandedSessions] = useState({});

  const toggleSession = (idx) => {
    setExpandedSessions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const response = await api.get(`/analytics/customer/${userId}/timeline`);
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch timeline');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [userId]);

  const processTimeline = (rawTimeline) => {
    if (!rawTimeline || rawTimeline.length === 0) return [];
    
    // 1. Sort ascending first to accurately collapse consecutive repetitive views and calculate session gaps
    const sortedAsc = [...rawTimeline].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 2. Filter out feedback_submitted behaviors to avoid duplicates,
    // and deduplicate behavior checkout_completed if the rich order object exists
    const orderIds = new Set(sortedAsc.filter(item => item.type === 'order').map(item => item._id?.toString()));
    let filtered = sortedAsc.filter(item => {
      if (item.type === 'behavior' && item.eventType === 'feedback_submitted') return false;
      if (item.type === 'behavior' && item.eventType === 'checkout_completed' && item.metadata?.orderId && orderIds.has(item.metadata.orderId)) {
        return false;
      }
      return true;
    });

    // 3. Collapse repetitive views
    let collapsed = [];
    for (let i = 0; i < filtered.length; i++) {
      let current = { ...filtered[i] };
      if (current.type === 'behavior' && (current.eventType === 'page_view' || current.eventType === 'product_view')) {
        let count = 1;
        let totalDuration = current.duration || 0;
        let j = i + 1;
        
        while (j < filtered.length) {
          const next = filtered[j];
          if (next.type !== 'behavior' || next.eventType !== current.eventType) break;
          
          const currentIdentifier = current.eventType === 'page_view' ? current.metadata?.path : current.metadata?.productName;
          const nextIdentifier = next.eventType === 'page_view' ? next.metadata?.path : next.metadata?.productName;
          
          if (currentIdentifier !== nextIdentifier) break;
          
          const timeGap = new Date(next.timestamp) - new Date(filtered[j-1].timestamp);
          if (timeGap > 5 * 60 * 1000) break;

          count++;
          totalDuration += (next.duration || 0);
          j++;
        }
        
        if (count > 1) {
          current.count = count;
          current.duration = totalDuration;
          i = j - 1; 
        }
      }
      collapsed.push(current);
    }

    // 4. Group by session (20 min gap)
    let sessions = [];
    let currentSession = null;

    collapsed.forEach((item) => {
      if (!currentSession) {
        currentSession = { events: [item], startTime: item.timestamp, summary: {} };
      } else {
        const lastEvent = currentSession.events[currentSession.events.length - 1];
        const gap = new Date(item.timestamp) - new Date(lastEvent.timestamp);
        
        if (gap > 20 * 60 * 1000) { 
          sessions.push(currentSession);
          currentSession = { events: [item], startTime: item.timestamp, summary: {} };
        } else {
          currentSession.events.push(item);
        }
      }
    });

    if (currentSession) {
      sessions.push(currentSession);
    }

    // 5. Generate richer summary for each session and sort events newest first
    sessions.forEach(session => {
      let totalDuration = 0;
      let uniqueProducts = new Set();
      let pagesVisited = new Set();
      let clickedProducts = new Set();
      let cartAdds = 0;
      let feedbackCount = 0;
      let ordersCount = 0;
      let orderTotal = 0;

      session.events.forEach(e => {
        if (e.type === 'behavior') {
          if (e.duration) totalDuration += e.duration;
          
          if (e.eventType === 'product_view' && e.metadata?.productName) {
            uniqueProducts.add(e.metadata.productName);
          }
          if (e.eventType === 'product_click' && e.metadata?.productName) {
            clickedProducts.add(e.metadata.productName);
          }
          if (e.eventType === 'page_view' && e.metadata?.path) {
            pagesVisited.add(e.metadata.path);
          }
          if (e.eventType === 'add_to_cart') cartAdds += (e.count || 1);
          if (e.eventType === 'checkout_completed') {
            ordersCount++;
            if (e.metadata?.totalAmount) orderTotal += Number(e.metadata.totalAmount);
          }
        } else if (e.type === 'feedback') {
          feedbackCount++;
        } else if (e.type === 'order') {
          ordersCount++;
          orderTotal += Number(e.totalAmount || 0);
        }
      });

      session.summary = {
        totalDuration,
        uniqueProducts: uniqueProducts.size,
        pagesVisited: pagesVisited.size,
        clickedProducts: Array.from(clickedProducts),
        cartAdds,
        feedbackCount,
        ordersCount,
        orderTotal
      };

      // Order events inside the session from Newest to Oldest
      session.events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });

    // Sort sessions from Newest to Oldest
    sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    return sessions;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-gray-500 font-mono tracking-widest text-sm uppercase">Loading Timeline...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-red-500">{error}</div>;
  if (!data) return null;

  const processedSessions = processTimeline(data.timeline);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white py-12 md:py-16">
      <div className="max-w-[1000px] mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight flex items-center">
              Customer 360
            </h1>
            <p className="mt-4 text-sm text-gray-500 tracking-wide">
              Viewing full journey for <span className="font-semibold text-gray-900">{data.user.name}</span> ({data.user.email})
            </p>
          </div>
          <Link to="/admin" className="inline-flex items-center text-sm font-medium hover:underline underline-offset-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>

        {/* Sessions List */}
        <div className="space-y-0 border-t border-gray-400">
          {processedSessions.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              No activity recorded for this user yet.
            </div>
          ) : (
            processedSessions.map((session, sIdx) => {
              const isExpanded = expandedSessions[sIdx];
              return (
                <div key={sIdx} className="border-b border-gray-400 transition-all duration-200">
                  
                  {/* Clickable Header & Grid Summary */}
                  <div 
                    onClick={() => toggleSession(sIdx)}
                    className="hover:bg-[#f2f2f2] cursor-pointer py-6 px-4 md:px-6 transition-colors flex flex-col gap-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-serif font-medium tracking-tight">
                        Session — {formatDate(session.startTime)} at {formatTime(session.startTime)}
                      </h3>
                      <div className="text-gray-400 transition-colors">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                    
                    {/* Metric Boxes Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 border-t border-gray-200 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Time Spent</span>
                        <span className="text-2xl font-serif">{session.summary.totalDuration}s</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Pages Visited</span>
                        <span className="text-2xl font-serif">{session.summary.pagesVisited}</span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Products Viewed</span>
                        <span className="text-2xl font-serif">{session.summary.uniqueProducts}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Orders (Demo)</span>
                        <span className="text-2xl font-serif text-emerald-700">
                          {session.summary.ordersCount > 0 ? `${session.summary.ordersCount}` : '0'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Feedback</span>
                        <span className="text-2xl font-serif">{session.summary.feedbackCount > 0 ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    {/* Clicked Products tags if any */}
                    {session.summary.clickedProducts.length > 0 && (
                      <div className="mt-2 flex items-center flex-wrap gap-2 text-sm">
                        <span className="font-semibold text-gray-700 text-xs uppercase tracking-widest">Clicked:</span>
                        {session.summary.clickedProducts.map(p => (
                          <span key={p} className="inline-block border border-[#111111] px-2 py-0.5 text-xs">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Expandable Events List */}
                  {isExpanded && (
                    <div className="px-4 md:px-6 pb-8 bg-[#fcfcfc]">
                      <div className="relative border-l border-gray-300 ml-4 pt-6">
                        {session.events.map((item, index) => {
                          const isBehavior = item.type === 'behavior';
                          const isFeedback = item.type === 'feedback';
                          const isOrder = item.type === 'order';

                          return (
                            <div key={item._id || index} className="mb-10 ml-8 relative">
                              {/* Timeline Dot/Icon */}
                              <span className="absolute flex items-center justify-center w-8 h-8 bg-[#fcfcfc] border border-gray-400" style={{ left: '-3.1rem' }}>
                                {isOrder ? (
                                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                                ) : isBehavior ? (
                                  getEventIcon(item.eventType)
                                ) : (
                                  <MessageSquare className="w-4 h-4 text-[#111111]" />
                                )}
                              </span>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center">
                                  {isOrder ? (
                                    <span className="text-emerald-700 font-bold">
                                      ORDER PLACED • {item.orderNumber}
                                    </span>
                                  ) : isBehavior ? (
                                    item.eventType === 'checkout_completed' ? (
                                      <span className="text-emerald-700">CHECKOUT COMPLETED</span>
                                    ) : item.eventType === 'checkout_start' ? (
                                      <span className="text-gray-900">CHECKOUT INITIATED</span>
                                    ) : (
                                      item.eventType.replace(/_/g, ' ')
                                    )
                                  ) : (
                                    'SUBMITTED FEEDBACK'
                                  )}
                                  {item.count > 1 && (
                                    <span className="ml-3 border border-[#111111] px-1 text-[10px]">
                                      {item.count}x
                                    </span>
                                  )}
                                </h3>
                                <time className="block mt-1 sm:mt-0 text-xs font-medium text-gray-400">
                                  {formatDate(item.timestamp)} • {formatTime(item.timestamp)}
                                </time>
                              </div>

                              {/* Content Body */}
                              <div className="mt-2 text-sm text-gray-600">
                                {isOrder && (
                                  <div className="bg-[#f0fdf4] border border-emerald-400 p-5 mt-2 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                                      <div>
                                        <span className="text-[10px] font-mono uppercase bg-emerald-700 text-white px-2 py-0.5 tracking-wider font-bold">
                                          Database Verified Demo Order
                                        </span>
                                        <p className="text-xs text-gray-600 mt-1.5">
                                          Payment: <strong className="text-gray-900">{item.paymentMethod || 'Demo Card'}</strong>
                                        </p>
                                      </div>
                                      <div className="text-left sm:text-right">
                                        <span className="text-xl font-bold font-mono text-emerald-800 block">
                                          ${item.totalAmount?.toFixed(2)}
                                        </span>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                          {item.items?.length || 0} items in order
                                        </span>
                                      </div>
                                    </div>

                                    {item.items && item.items.length > 0 && (
                                      <div className="space-y-1.5 py-1">
                                        {item.items.map((prod, pIdx) => (
                                          <div key={pIdx} className="flex justify-between items-center text-xs text-gray-800">
                                            <span className="font-medium">• {prod.name} (Qty: {prod.quantity})</span>
                                            <span className="font-mono text-gray-600">${(prod.price * prod.quantity).toFixed(2)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    <div className="text-xs text-gray-500 pt-2 border-t border-emerald-200 flex flex-wrap justify-between gap-2">
                                      <span>Ship to: {item.customerInfo?.city}, {item.customerInfo?.address}</span>
                                      <span className="font-mono text-emerald-700 font-bold">Status: {item.orderStatus || 'Confirmed'}</span>
                                    </div>
                                  </div>
                                )}

                                {isBehavior && item.eventType !== 'checkout_completed' && (
                                  <div className="bg-[#f2f2f2] border border-gray-300 p-4 flex flex-wrap gap-6 items-center text-xs uppercase tracking-wider">
                                    {item.metadata?.path && (
                                      <div><span className="text-gray-400">Path:</span> {item.metadata.path}</div>
                                    )}
                                    {item.metadata?.productName && (
                                      <div><span className="text-gray-400">Product:</span> {item.metadata.productName}</div>
                                    )}
                                    {item.duration > 0 && (
                                      <div className="flex items-center text-[#111111]">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        {item.duration}s
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isBehavior && item.eventType === 'checkout_completed' && (
                                  <div className="bg-[#f0fdf4] border border-emerald-300 p-4 text-xs space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-emerald-800 uppercase tracking-wider font-mono">
                                        {item.metadata?.orderNumber || 'Order Placed'}
                                      </span>
                                      <span className="font-mono font-bold text-emerald-800">
                                        ${item.metadata?.totalAmount}
                                      </span>
                                    </div>
                                    <p className="text-gray-600">
                                      {item.metadata?.itemsSummary || `${item.metadata?.itemsCount} items`}
                                    </p>
                                  </div>
                                )}

                                {isFeedback && (
                                  <div className="bg-[#f2f2f2] border border-gray-400 p-5 mt-2">
                                    <div className="flex justify-between items-start mb-4">
                                      <div className="font-serif text-lg flex items-center">
                                        {item.rating} <span className="text-[#111111] ml-1 text-sm">★</span>
                                      </div>
                                      <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border ${SENTIMENT_STYLES[item.sentiment] || SENTIMENT_STYLES.Pending}`}>
                                        {item.sentiment}
                                      </span>
                                    </div>
                                    <p className="text-gray-800 text-sm leading-relaxed mb-4">"{item.comment}"</p>
                                    <div className="flex flex-col sm:flex-row gap-4 text-xs text-gray-500 pt-4 border-t border-gray-300 uppercase tracking-widest">
                                      <span>Cat: {item.category}</span>
                                      {item.productId && <span>Prod: {item.productId.name}</span>}
                                    </div>
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTimeline;
