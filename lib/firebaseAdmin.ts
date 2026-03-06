import * as admin from 'firebase-admin';

// Protect against multiple initializations in Next.js development mode
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The replace() function ensures the private key formatting doesn't break
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin Initialized Successfully");
  } catch (error) {
    console.error('Firebase Admin Initialization Error', error);
  }
}

const db = admin.firestore();
export { db };