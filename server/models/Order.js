const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest checkout, attached when logged in
  },
  sessionId: {
    type: String,
    required: false,
  },
  customerInfo: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'United States' },
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
      image: { type: String, default: '' },
    }
  ],
  subtotal: {
    type: Number,
    required: true,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    default: 'Demo Card (Simulated)',
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Demo Simulated'],
    default: 'Paid',
  },
  orderStatus: {
    type: String,
    enum: ['Confirmed', 'Processing', 'Delivered'],
    default: 'Confirmed',
  },
  isDemo: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Order', orderSchema);
