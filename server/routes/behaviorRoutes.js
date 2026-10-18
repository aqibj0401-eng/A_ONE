const express = require('express');
const router = express.Router();
const { trackEvent, getAnalytics } = require('../controllers/behaviorController');
const { protect, admin } = require('../middleware/auth');

router.post('/event', protect, trackEvent);
router.get('/analytics', protect, admin, getAnalytics);

module.exports = router;
