import { env } from './env';

let adminApp: any = null;

export function getFirebaseAdmin() {
  if (!env.FIREBASE_CONFIGURED) return null;
  if (adminApp) return adminApp;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
    storageBucket: env.FIREBASE_STORAGE_BUCKET || undefined,
  });
  adminApp = admin;
  return adminApp;
}

/**
 * Verifies a Firebase ID token when Firebase is configured. Throws on failure.
 * Callers must only reach this function when env.FIREBASE_CONFIGURED is true;
 * the auth middleware handles the demo-mode JWT path separately.
 */
export async function verifyFirebaseIdToken(idToken: string) {
  const admin = getFirebaseAdmin();
  if (!admin) {
    throw new Error('Firebase is not configured on this server');
  }
  return admin.auth().verifyIdToken(idToken);
}
