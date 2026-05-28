const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed (JPG, PNG, WEBP, GIF)'), false);
  },
});

const PLAN_COINS = {
  free: { coins: 7, label: 'Free', price: 0 },
  starter: { coins: 50, label: 'Starter', price: 749 },
  pro: { coins: 200, label: 'Pro', price: 2399 },
  elite: { coins: 999, label: 'Elite', price: 6499 },
};

const REMOVAL_BG_API_KEY = process.env.REMOVAL_BG_API_KEY;

const toDataUrl = (buffer) => `data:image/png;base64,${buffer.toString('base64')}`;

const removeBackgroundWithRemoveBg = async (file) => {
  if (!REMOVAL_BG_API_KEY) {
    throw new Error('REMOVAL_BG_API_KEY is not configured.');
  }

  const formData = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype });
  formData.append('image_file', blob, file.originalname || 'upload.png');
  formData.append('size', 'auto');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': REMOVAL_BG_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`remove.bg failed with status ${response.status}: ${detail}`);
  }

  return {
    image: toDataUrl(Buffer.from(await response.arrayBuffer())),
    provider: 'remove.bg',
    model: 'remove.bg',
  };
};

const removeBackground = async (file) => {
  return removeBackgroundWithRemoveBg(file);
};

router.post('/remove-bg', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    let user = await User.findById(req.userId);
    if (!user) {
      user = await User.createFromFirebase(req.firebaseUser);
    }

    user.checkMonthReset();

    if (user.coins <= 0) {
      return res.status(403).json({
        message: 'Your coins are exhausted! Upgrade your plan to continue.',
        coins: user.coins,
        plan: user.plan,
        limitReached: true,
      });
    }

    const result = await removeBackground(req.file);

    user.coins -= 1;
    user.totalImagesProcessed += 1;
    user.imagesThisMonth += 1;
    await user.save();

    res.json({
      success: true,
      image: result.image,
      coinsLeft: user.coins,
      totalProcessed: user.totalImagesProcessed,
      model: result.model,
      provider: result.provider,
      message: `Background removed! ${user.coins} coins remaining.`,
    });
  } catch (error) {
    console.error('🔥 REAL ERROR:', error);
    console.error('🔥 ERROR MESSAGE:', error.message);
    console.error('🔥 ERROR STACK:', error.stack);
    res.status(500).json({
      message: error.message || 'Failed to process image. Please try again.',
      model: 'remove.bg',
      provider: 'remove.bg',
    });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    let user = await User.findById(req.userId);
    if (!user) {
      user = await User.createFromFirebase(req.firebaseUser);
    }

    res.json({
      coins: user.coins,
      plan: user.plan,
      totalImagesProcessed: user.totalImagesProcessed,
      imagesThisMonth: user.imagesThisMonth,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upgrade', auth, async (req, res) => {
  res.status(410).json({
    message: 'Plan upgrades now require Razorpay payment. Use /api/payments/create-order.',
  });
});

module.exports = router;
