const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const getCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    return admin.credential.cert(JSON.parse(json));
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const credentialPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
      ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      : path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

    if (fs.existsSync(credentialPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
      return admin.credential.cert(serviceAccount);
    }

    console.warn(`Firebase service account file not found at ${credentialPath}. Falling back to application default credentials.`);
  }

  return admin.credential.applicationDefault();
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getCredential(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'bakgroundremovel',
  });
}

const db = admin.firestore();

module.exports = { admin, db };
