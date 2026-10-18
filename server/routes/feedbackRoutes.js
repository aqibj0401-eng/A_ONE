const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedback,
  getFeedbackById,
  deleteFeedback,
} = require('../controllers/feedbackController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .post(protect, submitFeedback)
  .get(protect, admin, getFeedback);

router.route('/:id')
  .get(protect, admin, getFeedbackById)
  .delete(protect, admin, deleteFeedback);

module.exports = router;
