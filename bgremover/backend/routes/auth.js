const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

const publicUser = (user) => ({
  id: user._id,
  uid: user.uid,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  plan: user.plan,
  coins: user.coins,
  totalImagesProcessed: user.totalImagesProcessed,
  imagesThisMonth: user.imagesThisMonth,
});

const sendFirebaseError = (res, error, fallbackMessage) => {
  if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
    return res.status(503).json({
      message: 'Firestore database is not created for this Firebase project. Open Firebase Console > Firestore Database > Create database, then restart the backend.',
      setupRequired: 'firestore',
    });
  }

  if (error?.code === 7 || error?.message?.includes('PERMISSION_DENIED')) {
    return res.status(403).json({
      message: 'Firebase service account does not have permission to access Firestore.',
      setupRequired: 'firebase-permissions',
    });
  }

  return res.status(500).json({ message: fallbackMessage });
};

router.post('/session', auth, async (req, res) => {
  try {
    const user = await User.createFromFirebase(req.firebaseUser, req.body);
    user.checkMonthReset();
    await user.save();

    res.json({
      message: 'Session ready',
      user: publicUser(user),
    });
  } catch (error) {
    console.error('Session sync error:', error);
    return sendFirebaseError(res, error, 'Server error while preparing session');
  }
});

router.get('/profile', auth, async (req, res) => {
  try {
    let user = await User.findById(req.userId);
    if (!user) {
      user = await User.createFromFirebase(req.firebaseUser);
    }

    user.checkMonthReset();
    await user.save();

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Profile error:', error);
    return sendFirebaseError(res, error, 'Server error');
  }
});

module.exports = router;
