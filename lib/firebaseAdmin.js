import admin from 'firebase-admin';

let app;
try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    if (!projectId || !clientEmail || !privateKey) throw new Error('Firebase admin not configured');
    app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    app = admin.app();
  }
} catch (e) {
  // Defer errors to callers — keep module import safe in non-configured environments
  // console.warn('Firebase admin init failed:', e.message);
}

export function getFirebaseAdmin() {
  if (!admin.apps.length) throw new Error('Firebase admin not initialized');
  return admin;
}

export default admin;
