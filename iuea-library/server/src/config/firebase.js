const admin = require('firebase-admin');

let firebaseApp;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  console.log('Firebase Admin initialized.');
  return firebaseApp;
};

const getMessaging = () => {
  if (!firebaseApp) initFirebase();
  return admin.messaging();
};

module.exports = { initFirebase, getMessaging };
