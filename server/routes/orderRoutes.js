const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getOrderById, 
  getMyOrders, 
  getAllOrders, 
  getOrderStats 
} = require('../controllers/orderController');
const { protect, admin, optionalProtect } = require('../middleware/auth');

router.post('/', optionalProtect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', getOrderById);

module.exports = router;
