import Razorpay from 'razorpay';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Policy } from '../models/Policy.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', description, policyId, notes = {} } = req.body;

  if (!policyId) {
    return res.status(400).json({ message: 'policyId is required' });
  }

  const policy = await Policy.findOne({ _id: policyId, user: req.user._id, policyType: 'SELF_PURCHASED' });
  if (!policy) {
    return res.status(404).json({ message: 'Policy not found' });
  }

  if (policy.paymentStatus === 'SUCCESS' && policy.status === 'ACTIVE') {
    return res.status(400).json({ message: 'This policy is already activated' });
  }

  const expectedAmount = Number(policy.monthlyPremium || 0);
  if (Number(amount) !== expectedAmount) {
    return res.status(400).json({ message: 'Order amount does not match policy premium' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      description,
      receipt: `policy-${policy._id.toString()}`,
      notes: {
        policyId,
        userId: req.user._id.toString(),
        ...notes
      }
    });

    policy.paymentStatus = 'PENDING';
    policy.razorpayOrderId = order.id;
    policy.status = 'PENDING_PAYMENT';
    await policy.save();

    res.status(201).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

export const getOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    const order = await razorpay.orders.fetch(orderId);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      attempts: order.attempts,
      payments: order.payments
    });
  } catch (error) {
    console.error('Razorpay fetch order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});
