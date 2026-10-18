const express = require('express');
const router = express.Router();
const { generateSummary, generateRecommendations, generateCorrelationInsights } = require('../controllers/aiController');
const { protect, admin } = require('../middleware/auth');

router.post('/generate-summary', protect, admin, generateSummary);
router.post('/generate-recommendations', protect, admin, generateRecommendations);
router.post('/generate-correlation-insights', protect, admin, generateCorrelationInsights);

module.exports = router;
