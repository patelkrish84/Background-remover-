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
const BACKGROUND_REMOVAL_PROVIDER = process.env.BACKGROUND_REMOVAL_PROVIDER || 'auto';
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
    child.stdin.on('error', error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Unable to send image to rembg Python process: ${error.message}`));
    });
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

      resolve({
        image: toDataUrl(Buffer.concat(output)),
        provider: 'local',
        model: `rembg/${process.env.REMBG_MODEL || 'u2netp'}`,
      });
    });

    child.stdin.end(file.buffer);
  });
};

const removeBackground = async (file) => {
  if (BACKGROUND_REMOVAL_PROVIDER === 'removebg') {
    return removeBackgroundWithRemoveBg(file);
  }

  if (BACKGROUND_REMOVAL_PROVIDER === 'local') {
    return removeBackgroundWithRembg(file);
  }

  if (REMOVAL_BG_API_KEY) {
    return removeBackgroundWithRemoveBg(file);
  }

  return removeBackgroundWithRembg(file);
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
    console.error('Remove BG error:', error.message);
    res.status(500).json({
      message: error.message || 'Failed to process image. Please try again.',
      model: process.env.REMBG_MODEL ? `rembg/${process.env.REMBG_MODEL}` : 'rembg/u2netp',
      provider: REMOVAL_BG_API_KEY ? 'remove.bg' : 'local',
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
