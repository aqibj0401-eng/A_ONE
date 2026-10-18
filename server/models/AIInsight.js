const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  summary: {
    type: String,
    required: false,
  },
  topIssues: {
    type: [String],
    default: [],
  },
  positivePoints: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: String,
    required: false,
  },
  correlationInsights: {
    type: String,
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('AIInsight', aiInsightSchema);
