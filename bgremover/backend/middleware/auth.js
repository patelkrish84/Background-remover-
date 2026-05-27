const { admin } = require('../firebase');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No Firebase token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.userId = decoded.uid;
    req.email = decoded.email;
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired Firebase token' });
  }
};
