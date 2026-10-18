const aiService = require('../services/aiService');
const Feedback = require('../models/Feedback');
const BehaviorEvent = require('../models/BehaviorEvent');
const AIInsight = require('../models/AIInsight'); // We'll create this next

// @desc    Generate a summary of recent feedback
// @route   POST /api/ai/generate-summary
// @access  Private/Admin
const generateSummary = async (req, res) => {
  try {
    const recentFeedback = await Feedback.find().sort('-createdAt').limit(100);
    const summary = await aiService.generateSummary(recentFeedback);
    
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate actionable recommendations based on stats and feedback
// @route   POST /api/ai/generate-recommendations
// @access  Private/Admin
const generateRecommendations = async (req, res) => {
  try {
    const recentFeedback = await Feedback.find().sort('-createdAt').limit(50);
    
    // Calculate simple stats to pass to AI
    const totalCustomers = await require('../models/User').countDocuments({ role: 'customer' });
    const totalFeedback = await Feedback.countDocuments();
    const positiveFeedback = await Feedback.countDocuments({ sentiment: 'Positive' });
    const negativeFeedback = await Feedback.countDocuments({ sentiment: 'Negative' });

    const stats = {
      totalCustomers,
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      positiveRatio: (positiveFeedback / (totalFeedback || 1)).toFixed(2)
    };

    const recommendations = await aiService.generateRecommendations(stats, recentFeedback);
    
    // Optionally save the insight to DB for historical record
    const insight = new AIInsight({
      summary: "Generated recommendations",
      recommendations: recommendations
    });
    await insight.save();

    res.json({ recommendations, insightId: insight._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate correlation insights from behavior and feedback
// @route   POST /api/ai/generate-correlation-insights
// @access  Private/Admin
const generateCorrelationInsights = async (req, res) => {
  try {
    // 1. Fetch recent feedback (prioritize negative)
    const feedbacks = await Feedback.find().populate('productId', 'name').sort({ sentiment: 1, createdAt: -1 }).limit(50).lean();
    
    if (!feedbacks.length) {
      return res.json({ correlationInsights: "No feedback data available to analyze." });
    }

    const summaries = [];
    
    // 2. Build summary string
    for (const feedback of feedbacks) {
      if (!feedback.userId) continue;
      
      const behaviors = await BehaviorEvent.find({ userId: feedback.userId }).sort('timestamp').lean();
      
      let behaviorSummaryStr = "";
      if (behaviors.length === 0) {
        behaviorSummaryStr = "No behavior data available.";
      } else {
        let totalDuration = 0;
        let productViews = {};
        let cartAdds = 0;
        let pageViews = {};
        
        behaviors.forEach(b => {
          if (b.duration) totalDuration += b.duration;
          if (b.eventType === 'product_view' && b.metadata?.productName) {
            productViews[b.metadata.productName] = (productViews[b.metadata.productName] || 0) + 1;
          }
          if (b.eventType === 'page_view' && b.metadata?.path) {
            pageViews[b.metadata.path] = (pageViews[b.metadata.path] || 0) + 1;
          }
          if (b.eventType === 'add_to_cart') cartAdds++;
        });
        
        const productsStr = Object.keys(productViews).length > 0 ? `Viewed products: ${Object.keys(productViews).join(', ')}.` : '';
        const pagesStr = Object.keys(pageViews).length > 0 ? `Visited pages: ${Object.keys(pageViews).join(', ')}.` : '';
        const cartStr = cartAdds > 0 ? `Added items to cart ${cartAdds} times.` : '';
        
        behaviorSummaryStr = `User spent ${totalDuration}s browsing. ${pagesStr} ${productsStr} ${cartStr}`.trim();
      }
      
      const productName = feedback.productId?.name || 'Unknown Product';
      summaries.push(`---
BEHAVIOR: ${behaviorSummaryStr}
FEEDBACK: Left ${feedback.rating}-star review for '${productName}' (${feedback.sentiment}): "${feedback.comment}"`);
    }

    const finalPromptData = summaries.join('\n\n');
    
    const correlationInsights = await aiService.generateCorrelationInsights(finalPromptData);
    
    // 3. Save to AIInsight
    const insight = new AIInsight({
      correlationInsights: correlationInsights
    });
    await insight.save();

    res.json({ correlationInsights, insightId: insight._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateSummary,
  generateRecommendations,
  generateCorrelationInsights
};
