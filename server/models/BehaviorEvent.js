const mongoose = require('mongoose');

const behaviorEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional if we want to track anonymous users in the future, but currently required for logged-in tracking
  },
  sessionId: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    enum: ['page_view', 'product_view', 'product_click', 'add_to_cart', 'feedback_submitted', 'login', 'logout', 'checkout_start', 'checkout_completed'],
    required: true,
  },
  metadata: {
    // Flexible object to store related data like productId, page URL, etc.
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  duration: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('BehaviorEvent', behaviorEventSchema);
