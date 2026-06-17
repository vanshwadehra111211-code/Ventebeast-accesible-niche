import admin from 'firebase-admin';

function initializeAdmin() {
  if (admin.apps.length) return admin;
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim()
    : undefined;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase admin not configured');
  }
  return admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

export function getFirebaseAdmin() {
  try {
    initializeAdmin();
  } catch (e) {
    throw new Error(`Firebase admin init failed: ${e.message}`);
  }
  return admin;
}

export default admin;
