const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false, // Optional: might be general website feedback
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Product Quality', 'Price', 'Delivery', 'Customer Service', 'Website Experience', 'Other'],
    required: true,
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Negative', 'Neutral', 'Pending'],
    default: 'Pending',
  },
  sentimentScore: {
    type: Number,
  },
  confidence: {
    type: Number,
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
