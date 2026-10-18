const User = require('../models/User');
const Feedback = require('../models/Feedback');
const BehaviorEvent = require('../models/BehaviorEvent');
const Product = require('../models/Product');
const Order = require('../models/Order');

// @desc    Get top level dashboard stats
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalFeedback = await Feedback.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    // Average rating
    const feedbackList = await Feedback.find();
    const avgRating = totalFeedback > 0 
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback).toFixed(1) 
      : 0;

    // Sentiment %
    const positiveCount = await Feedback.countDocuments({ sentiment: 'Positive' });
    const negativeCount = await Feedback.countDocuments({ sentiment: 'Negative' });
    const positivePercent = totalFeedback > 0 ? Math.round((positiveCount / totalFeedback) * 100) : 0;
    const negativePercent = totalFeedback > 0 ? Math.round((negativeCount / totalFeedback) * 100) : 0;

    res.json({
      totalCustomers,
      totalFeedback,
      totalOrders,
      avgRating: Number(avgRating),
      positivePercent,
      negativePercent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rating distribution (1-5 stars count)
// @route   GET /api/analytics/ratings
// @access  Private/Admin
const getRatingDistribution = async (req, res) => {
  try {
    const distribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Format for Recharts: [{ name: '1 Star', count: X }, ...]
    const formatted = [1, 2, 3, 4, 5].map(star => {
      const found = distribution.find(d => d._id === star);
      return {
        name: `${star} Star`,
        count: found ? found.count : 0
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sentiment distribution
// @route   GET /api/analytics/sentiment
// @access  Private/Admin
const getSentimentDistribution = async (req, res) => {
  try {
    const distribution = await Feedback.aggregate([
      { $group: { _id: '$sentiment', value: { $sum: 1 } } }
    ]);
    
    // Format: [{ name: 'Positive', value: X }]
    const formatted = distribution.map(d => ({
      name: d._id,
      value: d.value
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get most viewed pages
// @route   GET /api/analytics/pages
// @access  Private/Admin
const getTopPages = async (req, res) => {
  try {
    const pages = await BehaviorEvent.aggregate([
      { $match: { eventType: 'page_view' } },
      { $group: { _id: '$metadata.path', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);

    const formatted = pages.map(p => ({
      name: p._id || 'Unknown',
      views: p.views
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get most viewed products
// @route   GET /api/analytics/products
// @access  Private/Admin
const getTopProducts = async (req, res) => {
  try {
    const products = await BehaviorEvent.aggregate([
      { $match: { eventType: 'product_view' } },
      { $group: { _id: '$metadata.productName', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 5 }
    ]);

    const formatted = products.map(p => ({
      name: p._id || 'Unknown Product',
      views: p.views
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get merged timeline for a specific customer
// @route   GET /api/analytics/customer/:userId/timeline
// @access  Private/Admin
const getCustomerTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch User
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch Behavior Events
    const behaviors = await BehaviorEvent.find({ userId }).lean();
    
    // Fetch Feedback
    const feedbacks = await Feedback.find({ userId }).populate('productId', 'name').lean();

    // Fetch Orders
    const orders = await Order.find({ userId }).lean();

    // Map Behavior Events
    const mappedBehaviors = behaviors.map(b => ({
      ...b,
      type: 'behavior',
      timestamp: b.timestamp
    }));

    // Map Feedbacks
    const mappedFeedbacks = feedbacks.map(f => ({
      ...f,
      type: 'feedback',
      timestamp: f.createdAt
    }));

    // Map Orders
    const mappedOrders = orders.map(o => ({
      ...o,
      type: 'order',
      timestamp: o.createdAt
    }));

    // Merge and sort descending (newest to oldest)
    const timeline = [...mappedBehaviors, ...mappedFeedbacks, ...mappedOrders].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    res.json({
      user,
      timeline
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get engagement vs sentiment data for scatter chart
// @route   GET /api/analytics/engagement-sentiment
// @access  Private/Admin
const getEngagementSentiment = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' }).select('name email _id');
    const behaviors = await BehaviorEvent.find().lean();
    const feedbacks = await Feedback.find().lean();

    const data = [];

    customers.forEach(customer => {
      const uid = customer._id.toString();
      
      // Calculate Engagement Score
      const userBehaviors = behaviors.filter(b => b.userId?.toString() === uid);
      let engagementScore = 0;
      let totalDuration = 0;
      
      userBehaviors.forEach(b => {
        if (b.eventType === 'product_view') engagementScore += 1;
        if (b.eventType === 'add_to_cart') engagementScore += 3;
        if (b.duration) totalDuration += b.duration;
      });
      
      engagementScore += (totalDuration / 60);

      // Calculate Sentiment Score
      const userFeedbacks = feedbacks.filter(f => f.userId?.toString() === uid);
      let sentimentSum = 0;
      
      userFeedbacks.forEach(f => {
        if (f.sentiment === 'Positive') sentimentSum += 1;
        if (f.sentiment === 'Negative') sentimentSum -= 1;
      });
      
      const sentimentScore = userFeedbacks.length > 0 ? (sentimentSum / userFeedbacks.length) : 0;

      // Only include users who have at least some engagement or feedback
      if (userBehaviors.length > 0 || userFeedbacks.length > 0) {
        data.push({
          userId: uid,
          userName: customer.name,
          engagementScore: Number(engagementScore.toFixed(2)),
          sentimentScore: Number(sentimentScore.toFixed(2))
        });
      }
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRatingDistribution,
  getSentimentDistribution,
  getTopPages,
  getTopProducts,
  getCustomerTimeline,
  getEngagementSentiment
};
