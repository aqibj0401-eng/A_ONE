const Feedback = require('../models/Feedback');
const aiService = require('../services/aiService');

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private (Customers/Admins)
const submitFeedback = async (req, res) => {
  const { productId, rating, comment, category } = req.body;

  try {
    // Phase 7: Analyze sentiment using Google Gemini Flash-Lite API
    const analysis = await aiService.analyzeSentiment(comment);

    const feedback = new Feedback({
      userId: req.user._id,
      productId: productId || null,
      rating,
      comment,
      category,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.sentimentScore,
      confidence: analysis.confidence
    });

    const createdFeedback = await feedback.save();
    res.status(201).json(createdFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private/Admin
const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({}).populate('userId', 'name email').populate('productId', 'name');
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private/Admin
const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('userId', 'name email').populate('productId', 'name');
    if (feedback) {
      res.json(feedback);
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (feedback) {
      await feedback.deleteOne();
      res.json({ message: 'Feedback removed' });
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackById,
  deleteFeedback,
};
