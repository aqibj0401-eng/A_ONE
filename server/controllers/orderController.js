const Order = require('../models/Order');
const BehaviorEvent = require('../models/BehaviorEvent');

// @desc    Create new demo order & record checkout
// @route   POST /api/orders
// @access  Public / Optional Auth
const createOrder = async (req, res) => {
  try {
    const { 
      customerInfo, 
      items, 
      subtotal, 
      shippingFee, 
      tax, 
      totalAmount, 
      paymentMethod,
      sessionId 
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    if (!customerInfo || !customerInfo.fullName || !customerInfo.email || !customerInfo.address) {
      return res.status(400).json({ message: 'Missing required customer contact or shipping details' });
    }

    // Generate unique academic/demo order number
    const timestampPart = Date.now().toString().slice(-5);
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${timestampPart}-${randomPart}`;

    const order = new Order({
      orderNumber,
      userId: req.user ? req.user._id : null,
      sessionId: sessionId || req.body.sessionId,
      customerInfo,
      items,
      subtotal: Number(subtotal) || 0,
      shippingFee: Number(shippingFee) || 0,
      tax: Number(tax) || 0,
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || 'Demo Card (Instant Simulation)',
      paymentStatus: 'Paid',
      orderStatus: 'Confirmed',
      isDemo: true,
    });

    const createdOrder = await order.save();

    // Log checkout_completed behavior event to feed into customer intelligence timeline
    try {
      await BehaviorEvent.create({
        userId: req.user ? req.user._id : null,
        sessionId: sessionId || 'session-checkout',
        eventType: 'checkout_completed',
        metadata: {
          orderId: createdOrder._id.toString(),
          orderNumber: createdOrder.orderNumber,
          totalAmount: createdOrder.totalAmount,
          itemsCount: createdOrder.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
          itemsSummary: createdOrder.items.map(i => `${i.name} (x${i.quantity})`).join(', ')
        }
      });
    } catch (eventErr) {
      console.warn('Could not record checkout behavior event:', eventErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully (Demo Mode)',
      order: createdOrder,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message || 'Server error creating order' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public / Customer / Admin
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const orders = await Order.find({ userId: req.user._id }).sort('-createdAt');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort('-createdAt')
      .limit(100);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order overview stats (Admin only)
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const allOrders = await Order.find().select('totalAmount items');
    
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
    
    res.json({
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      avgOrderValue: Number(avgOrderValue),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  getMyOrders,
  getAllOrders,
  getOrderStats,
};
