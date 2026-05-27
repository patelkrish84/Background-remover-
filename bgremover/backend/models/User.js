const { db } = require('../firebase');

const USERS = 'users';

class User {
  constructor(data) {
    Object.assign(this, data);
    this._id = data._id || data.uid;
  }

  static ref(uid) {
    return db.collection(USERS).doc(uid);
  }

  static fromDoc(doc) {
    if (!doc.exists) return null;
    return new User({ _id: doc.id, ...doc.data() });
  }

  static async findById(uid) {
    const doc = await User.ref(uid).get();
    return User.fromDoc(doc);
  }

  static async findOne(query) {
    if (!query?.email) return null;
    const snap = await db.collection(USERS).where('email', '==', query.email.toLowerCase()).limit(1).get();
    if (snap.empty) return null;
    return User.fromDoc(snap.docs[0]);
  }

  static async createFromFirebase(firebaseUser, extra = {}) {
    const uid = firebaseUser.uid;
    const now = new Date().toISOString();
    const existing = await User.findById(uid);

    const profile = {
      uid,
      name: extra.name || firebaseUser.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: (firebaseUser.email || extra.email || '').toLowerCase(),
      avatar: firebaseUser.picture || firebaseUser.photoURL || null,
      plan: existing?.plan || 'free',
      coins: existing?.coins ?? 7,
      totalImagesProcessed: existing?.totalImagesProcessed || 0,
      imagesThisMonth: existing?.imagesThisMonth || 0,
      monthReset: existing?.monthReset || now,
      createdAt: existing?.createdAt || now,
      lastLogin: now,
      provider: extra.provider || firebaseUser.firebase?.sign_in_provider || 'password',
    };

    await User.ref(uid).set(profile, { merge: true });
    return new User({ _id: uid, ...profile });
  }

  checkMonthReset() {
    const now = new Date();
    const lastReset = new Date(this.monthReset || Date.now());
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      this.imagesThisMonth = 0;
      this.monthReset = now.toISOString();
    }
  }

  async save() {
    const { _id, ...data } = this;
    await User.ref(_id).set(data, { merge: true });
    return this;
  }

  toJSON() {
    const { _id, ...data } = this;
    return { id: _id, ...data };
  }
}

module.exports = User;
