const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
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

const REMBG_PYTHON = process.env.REMBG_PYTHON || 'python';
const REMBG_SCRIPT = path.join(__dirname, '..', 'scripts', 'remove_bg.py');
const REMBG_TIMEOUT_MS = Number(process.env.REMBG_TIMEOUT_MS || 180000);

const removeBackgroundWithRembg = (file) => {
  return new Promise((resolve, reject) => {
    const child = spawn(REMBG_PYTHON, [REMBG_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        U2NET_HOME: process.env.U2NET_HOME || path.join(__dirname, '..', '.u2net'),
      },
    });

    const output = [];
    const errors = [];
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      child.kill('SIGKILL');
      reject(new Error('Local U-2-Net processing timed out. Try a smaller image.'));
    }, REMBG_TIMEOUT_MS);

    child.stdout.on('data', chunk => output.push(chunk));
    child.stderr.on('data', chunk => errors.push(chunk));
    child.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Unable to start rembg Python process: ${error.message}`));
    });

    child.on('close', code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      if (code !== 0) {
        const detail = Buffer.concat(errors).toString('utf8').trim();
        reject(new Error(detail || `rembg exited with code ${code}`));
        return;
      }

      resolve(`data:image/png;base64,${Buffer.concat(output).toString('base64')}`);
    });

    child.stdin.end(file.buffer);
  });
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

    const processedImage = await removeBackgroundWithRembg(req.file);

    user.coins -= 1;
    user.totalImagesProcessed += 1;
    user.imagesThisMonth += 1;
    await user.save();

    res.json({
      success: true,
      image: processedImage,
      coinsLeft: user.coins,
      totalProcessed: user.totalImagesProcessed,
      message: `Background removed! ${user.coins} coins remaining.`,
    });
  } catch (error) {
    console.error('Remove BG error:', error.message);
    res.status(500).json({
      message: error.message || 'Failed to process image. Please try again.',
      model: 'rembg/u2net',
      provider: 'local',
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
