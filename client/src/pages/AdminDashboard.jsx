import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Users, MessageSquare, Star, Activity, ArrowLeft, Brain, Sparkles, Trash2, Search, RotateCcw, AlertCircle, PackageCheck, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#111111', '#555555', '#888888', '#bbbbbb', '#dddddd'];
const SENTIMENT_COLORS = { 'Positive': '#111111', 'Neutral': '#888888', 'Negative': '#ef4444', 'Pending': '#cccccc' };

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [sentiments, setSentiments] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [scatterData, setScatterData] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [ordersStats, setOrdersStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiCorrelation, setAiCorrelation] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [correlationError, setCorrelationError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, ratingsRes, sentimentRes, pagesRes, productsRes, feedbackRes, scatterRes, ordersRes, ordersStatsRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/analytics/ratings'),
          api.get('/analytics/sentiment'),
          api.get('/analytics/pages'),
          api.get('/analytics/products'),
          api.get('/feedback'),
          api.get('/analytics/engagement-sentiment'),
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/orders/stats').catch(() => ({ data: { totalOrders: 0, totalRevenue: 0 } }))
        ]);

        setStats(statsRes.data);
        setRatings(ratingsRes.data);
        setSentiments(sentimentRes.data);
        setTopPages(pagesRes.data);
        setTopProducts(productsRes.data);
        setFeedbackList(feedbackRes.data);
        setScatterData(scatterRes.data);
        setOrdersList(ordersRes.data || []);
        setOrdersStats(ordersStatsRes.data || null);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await api.post('/ai/generate-summary');
      if (res.data?.summary && !res.data.summary.startsWith('An error occurred')) {
        setAiSummary(res.data.summary);
      } else {
        setSummaryError(res.data?.summary || 'An error occurred while generating the summary.');
      }
    } catch (error) {
      setSummaryError(error.response?.data?.message || 'An error occurred while generating the summary. Please check your connection and try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    try {
      const res = await api.post('/ai/generate-recommendations');
      if (res.data?.recommendations && !res.data.recommendations.startsWith('An error occurred')) {
        setAiRecommendations(res.data.recommendations);
      } else {
        setRecommendationsError(res.data?.recommendations || 'An error occurred while generating recommendations.');
      }
    } catch (error) {
      setRecommendationsError(error.response?.data?.message || 'An error occurred while generating recommendations. Please check your connection and try again.');
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleGenerateCorrelationInsights = async () => {
    setCorrelationLoading(true);
    setCorrelationError(null);
    try {
      const res = await api.post('/ai/generate-correlation-insights');
      if (res.data?.correlationInsights && !res.data.correlationInsights.startsWith('An error occurred')) {
        setAiCorrelation(res.data.correlationInsights);
      } else {
        setCorrelationError(res.data?.correlationInsights || 'An error occurred while generating correlation insights.');
      }
    } catch (error) {
      setCorrelationError(error.response?.data?.message || 'An error occurred while generating correlation insights. Please check your connection and try again.');
    } finally {
      setCorrelationLoading(false);
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await api.delete(`/feedback/${id}`);
        setFeedbackList(prev => prev.filter(f => f._id !== id));
      } catch (error) {
        alert('Failed to delete feedback');
      }
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center font-mono text-sm tracking-widest uppercase text-gray-500">Loading Dashboard...</div>;
  }

  const filteredFeedbackList = feedbackList.filter(f => {
    if (!feedbackSearch) return true;
    const s = feedbackSearch.toLowerCase();
    return (
      (f.comment?.toLowerCase() || '').includes(s) ||
      (f.userId?.name?.toLowerCase() || '').includes(s) ||
      (f.productId?.name?.toLowerCase() || '').includes(s) ||
      (f.sentiment?.toLowerCase() || '').includes(s)
    );
  }).reverse();

  const reviewerCounts = {};
  feedbackList.forEach(f => {
    if (f.userId && f.userId.name) {
      reviewerCounts[f.userId.name] = (reviewerCounts[f.userId.name] || 0) + 1;
    }
  });
  const topReviewers = Object.entries(reviewerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-500 tracking-wide">Overview of customer intelligence and behavior analytics.</p>
          </div>
          <Link to="/products" className="inline-flex items-center text-sm font-medium hover:underline underline-offset-4">
             <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-12">
          
          <div className="bg-[#f2f2f2] border border-gray-400 p-6 flex items-center">
            <Users className="h-6 w-6 text-[#111111]" />
            <div className="ml-4 w-0 flex-1">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-widest">Customers</dt>
              <dd className="text-2xl font-serif font-medium mt-1">{stats?.totalCustomers || 0}</dd>
            </div>
          </div>

          <div className="bg-[#f2f2f2] border border-gray-400 p-6 flex items-center">
            <PackageCheck className="h-6 w-6 text-emerald-700" />
            <div className="ml-4 w-0 flex-1">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-widest">Orders (Demo)</dt>
              <dd className="text-2xl font-serif font-medium mt-1">{ordersStats?.totalOrders || stats?.totalOrders || ordersList.length || 0}</dd>
            </div>
          </div>

          <div className="bg-[#f2f2f2] border border-gray-400 p-6 flex items-center">
            <ShoppingBag className="h-6 w-6 text-[#111111]" />
            <div className="ml-4 w-0 flex-1">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-widest">Demo Revenue</dt>
              <dd className="text-2xl font-serif font-medium mt-1">${ordersStats?.totalRevenue || 0}</dd>
            </div>
          </div>
          
          <div className="bg-[#f2f2f2] border border-gray-400 p-6 flex items-center">
            <MessageSquare className="h-6 w-6 text-[#111111]" />
            <div className="ml-4 w-0 flex-1">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-widest">Feedback</dt>
              <dd className="text-2xl font-serif font-medium mt-1">{stats?.totalFeedback || 0}</dd>
            </div>
          </div>

          <div className="bg-[#f2f2f2] border border-gray-400 p-6 flex items-center">
            <Activity className="h-6 w-6 text-[#111111]" />
            <div className="ml-4 w-0 flex-1">
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-widest">Positive %</dt>
              <dd className="text-2xl font-serif font-medium mt-1">{stats?.positivePercent || 0}%</dd>
            </div>
          </div>
        </div>

        {/* AI Insights Section (Dark Mode Block) */}
        <div className="bg-[#0a0a0a] border border-[#0a0a0a] text-[#fcfcfc] p-8 md:p-12 mb-12">
          <div className="flex items-center mb-8 border-b border-[#333333] pb-6">
            <Brain className="h-8 w-8 mr-4" />
            <h2 className="text-3xl font-serif font-medium tracking-tight">Gemini AI Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Executive Summary Card */}
            <div className="border border-[#333333] p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Executive Summary
                  </h3>
                  {aiSummary && !summaryLoading && (
                    <button
                      onClick={handleGenerateSummary}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      title="Regenerate Summary"
                    >
                      <RotateCcw className="w-3 h-3" /> Regenerate
                    </button>
                  )}
                </div>
                <p className="text-[#888888] mb-6 text-sm">Automatically generate a concise summary of all recent customer feedback.</p>
                
                {summaryLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3 text-gray-400">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs uppercase tracking-widest">Generating with Gemini AI...</span>
                  </div>
                ) : summaryError ? (
                  <div className="border border-red-800/80 bg-red-950/40 p-4 mb-4">
                    <div className="flex items-start gap-2.5 text-red-300 text-sm mb-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                      <span>{summaryError}</span>
                    </div>
                    <button 
                      onClick={handleGenerateSummary}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white transition-colors px-4 py-2 text-xs font-medium uppercase tracking-wider"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  </div>
                ) : aiSummary ? (
                  <div className="text-sm text-[#cccccc] prose prose-invert max-h-64 overflow-y-auto leading-relaxed">
                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  </div>
                ) : null}
              </div>

              {!aiSummary && !summaryLoading && !summaryError && (
                <button 
                  onClick={handleGenerateSummary}
                  className="bg-[#fcfcfc] text-[#0a0a0a] hover:bg-gray-200 transition-colors px-6 py-3 text-sm font-medium self-start mt-2"
                >
                  Generate Summary
                </button>
              )}
            </div>

            {/* Actionable Recommendations Card */}
            <div className="border border-[#333333] p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Actionable Recommendations
                  </h3>
                  {aiRecommendations && !recommendationsLoading && (
                    <button
                      onClick={handleGenerateRecommendations}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      title="Regenerate Recommendations"
                    >
                      <RotateCcw className="w-3 h-3" /> Regenerate
                    </button>
                  )}
                </div>
                <p className="text-[#888888] mb-6 text-sm">Get strategic business recommendations based on real behavior stats and feedback.</p>
                
                {recommendationsLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3 text-gray-400">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs uppercase tracking-widest">Generating recommendations...</span>
                  </div>
                ) : recommendationsError ? (
                  <div className="border border-red-800/80 bg-red-950/40 p-4 mb-4">
                    <div className="flex items-start gap-2.5 text-red-300 text-sm mb-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                      <span>{recommendationsError}</span>
                    </div>
                    <button 
                      onClick={handleGenerateRecommendations}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white transition-colors px-4 py-2 text-xs font-medium uppercase tracking-wider"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  </div>
                ) : aiRecommendations ? (
                  <div className="text-sm text-[#cccccc] prose prose-invert max-h-64 overflow-y-auto leading-relaxed">
                    <ReactMarkdown>{aiRecommendations}</ReactMarkdown>
                  </div>
                ) : null}
              </div>

              {!aiRecommendations && !recommendationsLoading && !recommendationsError && (
                <button 
                  onClick={handleGenerateRecommendations}
                  className="bg-[#fcfcfc] text-[#0a0a0a] hover:bg-gray-200 transition-colors px-6 py-3 text-sm font-medium self-start mt-2"
                >
                  Generate Recommendations
                </button>
              )}
            </div>
            
            {/* Correlation Insights Card */}
            <div className="border border-[#333333] p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Correlation Insights
                  </h3>
                  {aiCorrelation && !correlationLoading && (
                    <button
                      onClick={handleGenerateCorrelationInsights}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
                      title="Regenerate Correlation Insights"
                    >
                      <RotateCcw className="w-3 h-3" /> Regenerate
                    </button>
                  )}
                </div>
                <p className="text-[#888888] mb-6 text-sm">Analyze behavior and feedback to discover hidden patterns.</p>
                
                {correlationLoading ? (
                  <div className="py-8 flex flex-col items-center justify-center space-y-3 text-gray-400">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span className="text-xs uppercase tracking-widest">Discovering correlation patterns...</span>
                  </div>
                ) : correlationError ? (
                  <div className="border border-red-800/80 bg-red-950/40 p-4 mb-4">
                    <div className="flex items-start gap-2.5 text-red-300 text-sm mb-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                      <span>{correlationError}</span>
                    </div>
                    <button 
                      onClick={handleGenerateCorrelationInsights}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white transition-colors px-4 py-2 text-xs font-medium uppercase tracking-wider"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  </div>
                ) : aiCorrelation ? (
                  <div className="text-sm text-[#cccccc] prose prose-invert max-h-64 overflow-y-auto leading-relaxed">
                    <ReactMarkdown>{aiCorrelation}</ReactMarkdown>
                  </div>
                ) : null}
              </div>

              {!aiCorrelation && !correlationLoading && !correlationError && (
                <button 
                  onClick={handleGenerateCorrelationInsights}
                  className="bg-[#fcfcfc] text-[#0a0a0a] hover:bg-gray-200 transition-colors px-6 py-3 text-sm font-medium self-start mt-2"
                >
                  Generate Correlation Insights
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          
          {/* Engagement vs Sentiment Scatter */}
          <div className="bg-[#f2f2f2] border border-gray-400 p-6 lg:col-span-2">
            <h3 className="text-lg font-serif font-medium mb-2">Engagement vs Sentiment</h3>
            <p className="text-sm text-gray-500 mb-8">Identify power users and satisfaction levels. Click a point to view their full journey.</p>
            <div className="h-80">
              {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cccccc" />
                    <XAxis type="number" dataKey="engagementScore" name="Engagement" tick={{fontSize: 12, fill: '#888888'}} axisLine={false} tickLine={false} />
                    <YAxis type="number" dataKey="sentimentScore" name="Sentiment" domain={[-1.2, 1.2]} tickCount={5} tick={{fontSize: 12, fill: '#888888'}} axisLine={false} tickLine={false} />
                    <ZAxis type="category" dataKey="userName" name="Customer" />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3', stroke: '#aaaaaa' }} contentStyle={{ borderRadius: 0, border: '1px solid #111111', backgroundColor: '#fcfcfc' }} />
                    <Scatter 
                      name="Customers" 
                      data={scatterData} 
                      onClick={(e) => {
                        if (e && e.userId) navigate(`/admin/customers/${e.userId}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.sentimentScore > 0 ? '#111111' : entry.sentimentScore < 0 ? '#ef4444' : '#888888'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>
          
          {/* Sentiment Chart */}
          <div className="bg-[#f2f2f2] border border-gray-400 p-6">
            <h3 className="text-lg font-serif font-medium mb-8">Feedback Sentiment</h3>
            <div className="h-72">
              {sentiments.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentiments}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sentiments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: 0, border: '1px solid #111111', backgroundColor: '#fcfcfc' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-[#f2f2f2] border border-gray-400 p-6">
            <h3 className="text-lg font-serif font-medium mb-8">Rating Distribution</h3>
            <div className="h-72">
              {ratings.some(r => r.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratings} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cccccc" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#888888'}} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#888888'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 0, border: '1px solid #111111', backgroundColor: '#fcfcfc' }} cursor={{fill: '#e5e5e5'}} />
                    <Bar dataKey="count" fill="#111111" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-[#f2f2f2] border border-gray-400 p-6">
            <h3 className="text-lg font-serif font-medium mb-8">Most Viewed Products</h3>
            <div className="h-72">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cccccc" />
                    <XAxis type="number" allowDecimals={false} tick={{fontSize: 12, fill: '#888888'}} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fill: '#111111'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 0, border: '1px solid #111111', backgroundColor: '#fcfcfc' }} cursor={{fill: '#e5e5e5'}} />
                    <Bar dataKey="views" fill="#555555" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-[#f2f2f2] border border-gray-400 p-6">
            <h3 className="text-lg font-serif font-medium mb-8">Most Visited Pages</h3>
            <div className="h-72">
              {topPages.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPages} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cccccc" />
                    <XAxis type="number" allowDecimals={false} tick={{fontSize: 12, fill: '#888888'}} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fill: '#111111'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: 0, border: '1px solid #111111', backgroundColor: '#fcfcfc' }} cursor={{fill: '#e5e5e5'}} />
                    <Bar dataKey="views" fill="#888888" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
              )}
            </div>
          </div>

        </div>

        {/* Feedback Management Table */}
        <div className="border border-gray-400 bg-[#fcfcfc]">
          <div className="px-6 py-6 border-b border-gray-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-serif font-medium">Feedback Database</h3>
                <span className="border border-[#111111] text-xs font-bold px-2 py-1">{filteredFeedbackList.length}</span>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pb-1">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search database..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                className="pl-8 pr-4 py-2 border-b border-gray-300 bg-transparent text-sm focus:border-black outline-none w-full transition-colors"
              />
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-auto max-h-[800px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#fcfcfc] sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Customer</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Product</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Rating</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Sentiment</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Comment</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest border-b border-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFeedbackList.length > 0 ? (
                  filteredFeedbackList.map((feedback) => (
                    <tr key={feedback._id} className="hover:bg-[#f2f2f2] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {feedback.userId ? (
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/customers/${feedback.userId._id || feedback.userId}`} className="underline underline-offset-4 hover:text-gray-500">
                              {feedback.userId.name || 'Unknown User'}
                            </Link>
                            {feedback.userId.name && reviewerCounts[feedback.userId.name] > 0 && (
                              <span className="text-[10px] text-gray-500 font-bold border border-gray-300 px-1.5 py-0.5 bg-gray-50" title="Total feedbacks submitted">
                                {reviewerCounts[feedback.userId.name]}
                              </span>
                            )}
                          </div>
                        ) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {feedback.productId?.name || 'General'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-serif text-lg">
                        {feedback.rating}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 text-xs border ${
                          feedback.sentiment === 'Positive' ? 'border-[#111111]' : 
                          feedback.sentiment === 'Negative' ? 'border-red-500 text-red-600' : 
                          'border-gray-400 text-gray-500'
                        }`}>
                          {feedback.sentiment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {feedback.comment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button 
                          onClick={() => handleDeleteFeedback(feedback._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-500 text-sm">
                      No feedback matches your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders Database (Demo Checkouts) */}
        <div className="border border-gray-400 bg-[#fcfcfc] mt-12">
          <div className="px-6 py-6 border-b border-gray-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-serif font-medium">Orders & Checkouts (Demo Records)</h3>
              <span className="border border-[#111111] text-xs font-bold px-2 py-1 bg-black text-white">
                {ordersList.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Live MongoDB records from checkout flow
            </p>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#fcfcfc] sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Order #</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Customer</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Items</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Total</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Payment</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest border-b border-gray-400">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest border-b border-gray-400">Customer 360</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {ordersList.length > 0 ? (
                  ordersList.map((order) => (
                    <tr key={order._id} className="hover:bg-[#f2f2f2] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-xs text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {order.customerInfo?.fullName || order.userId?.name || 'Guest User'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.customerInfo?.email || order.userId?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                        {order.items?.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'No items'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-emerald-800">
                        ${order.totalAmount?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {order.paymentMethod}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {order.orderStatus || 'Confirmed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {order.userId ? (
                          <Link
                            to={`/admin/customers/${order.userId._id || order.userId}`}
                            className="inline-block px-3 py-1 bg-black text-white text-[11px] font-medium hover:bg-gray-800 transition-colors uppercase tracking-wider"
                          >
                            View Journey
                          </Link>
                        ) : (
                          <span className="text-gray-400 text-xs">Guest Order</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-sm">
                      No checkout orders placed yet. Place an order in the store to see records populate here in real-time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
