const crypto = require('crypto');
const express = require('express');
const Razorpay = require('razorpay');
const { db } = require('../firebase');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const PLANS = {
  starter: { coins: 50, label: 'Starter', price: 749 },
  pro: { coins: 200, label: 'Pro', price: 2399 },
  elite: { coins: 999, label: 'Elite', price: 6499 },
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay keys. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env.');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const safeCompare = (a, b) => {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && crypto.timingSafeEqual(first, second);
};

router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

router.post('/create-order', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const planData = PLANS[plan];

    if (!planData) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    let user = await User.findById(req.userId);
    if (!user) {
      user = await User.createFromFirebase(req.firebaseUser);
    }

    const razorpay = getRazorpay();
    const receipt = `coins_${req.userId}_${Date.now()}`.slice(0, 40);
    const order = await razorpay.orders.create({
      amount: planData.price * 100,
      currency: 'INR',
      receipt,
      notes: {
        userId: req.userId,
        plan,
        coins: String(planData.coins),
      },
    });

    await db.collection('paymentOrders').doc(order.id).set({
      userId: req.userId,
      userEmail: user.email,
      plan,
      planLabel: planData.label,
      coins: planData.coins,
      amount: planData.price,
      amountPaise: planData.price * 100,
      currency: 'INR',
      razorpayOrderId: order.id,
      receipt,
      status: 'created',
      createdAt: new Date().toISOString(),
    });

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      planLabel: planData.label,
      coins: planData.coins,
      name: 'ClearCutAI',
      description: `${planData.label} coin package`,
      prefill: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({ message: error.message || 'Unable to create Razorpay order' });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const {
      plan,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing Razorpay payment details' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!process.env.RAZORPAY_KEY_SECRET || !safeCompare(expectedSignature, razorpay_signature)) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const orderRef = db.collection('paymentOrders').doc(razorpay_order_id);
    const userRef = User.ref(req.userId);
    let responsePayload;

    await db.runTransaction(async (transaction) => {
      const [orderDoc, userDoc] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(userRef),
      ]);

      if (!orderDoc.exists) {
        throw new Error('Payment order not found');
      }

      const order = orderDoc.data();
      if (order.userId !== req.userId) {
        throw new Error('Payment order does not belong to this user');
      }

      if (plan && order.plan !== plan) {
        throw new Error('Payment plan mismatch');
      }

      if (order.status === 'paid') {
        const currentUser = userDoc.data();
        responsePayload = {
          plan: currentUser.plan,
          coins: currentUser.coins,
          addedCoins: 0,
          totalImagesProcessed: currentUser.totalImagesProcessed || 0,
          alreadyCredited: true,
        };
        return;
      }

      const currentUser = userDoc.exists ? userDoc.data() : {};
      const coins = Number(currentUser.coins || 0) + Number(order.coins);
      const now = new Date().toISOString();

      transaction.set(userRef, {
        plan: order.plan,
        coins,
        lastPaymentAt: now,
        updatedAt: now,
      }, { merge: true });

      transaction.set(orderRef, {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: now,
      }, { merge: true });

      responsePayload = {
        plan: order.plan,
        coins,
        addedCoins: order.coins,
        totalImagesProcessed: currentUser.totalImagesProcessed || 0,
        alreadyCredited: false,
      };
    });

    res.json({
      message: responsePayload.alreadyCredited
        ? 'Payment already verified.'
        : `Payment verified! ${responsePayload.addedCoins} coins added.`,
      ...responsePayload,
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(500).json({ message: error.message || 'Payment verification failed' });
  }
});

module.exports = router;
