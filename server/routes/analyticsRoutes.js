const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getRatingDistribution,
  getSentimentDistribution,
  getTopPages,
  getTopProducts,
  getCustomerTimeline,
  getEngagementSentiment
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/auth');

router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/ratings', protect, admin, getRatingDistribution);
router.get('/sentiment', protect, admin, getSentimentDistribution);
router.get('/pages', protect, admin, getTopPages);
router.get('/products', protect, admin, getTopProducts);
router.get('/customer/:userId/timeline', protect, admin, getCustomerTimeline);
router.get('/engagement-sentiment', protect, admin, getEngagementSentiment);

module.exports = router;
