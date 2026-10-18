const BehaviorEvent = require('../models/BehaviorEvent');

// @desc    Track a new behavior event or update an existing one (e.g. adding duration)
// @route   POST /api/behavior/event
// @access  Private (Tracked for logged in users)
const trackEvent = async (req, res) => {
  const { eventId, sessionId, eventType, metadata, duration } = req.body;

  try {
    if (eventId) {
      // Update existing event (e.g., adding duration when user leaves page)
      const updatedEvent = await BehaviorEvent.findByIdAndUpdate(
        eventId,
        { $set: { duration: duration || 0 } },
        { new: true }
      );
      if (!updatedEvent) {
        return res.status(404).json({ message: 'Event not found' });
      }
      return res.json({ success: true, eventId: updatedEvent._id });
    }

    // Create new event
    const event = new BehaviorEvent({
      userId: req.user._id,
      sessionId,
      eventType,
      metadata,
      duration: duration || 0
    });

    const savedEvent = await event.save();
    res.status(201).json({ success: true, eventId: savedEvent._id });
  } catch (error) {
    // We typically don't want analytics tracking to break the UI, so we just log and return 500 silently in production
    console.error('Tracking Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get behavior analytics data (for Admin dashboard)
// @route   GET /api/behavior/analytics
// @access  Private/Admin
const getAnalytics = async (req, res) => {
  try {
    // This will be expanded in Phase 6 (Analytics Dashboard)
    // For now, just return all raw events
    const events = await BehaviorEvent.find().sort('-timestamp').limit(100);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  trackEvent,
  getAnalytics
};
