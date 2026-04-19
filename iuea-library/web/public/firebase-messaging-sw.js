importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

/**
 * Firebase Messaging Service Worker
 *
 * The app sends the Firebase client config via postMessage after the SW
 * is registered. We defer initialisation until that message arrives so
 * no secrets need to be hard-coded here.
 */

let messaging = null;

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'FIREBASE_CONFIG') return;
  if (messaging) return; // already initialised

  try {
    firebase.initializeApp(event.data.config);
    messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title ?? 'IUEA Library';
      const body  = payload.notification?.body  ?? '';
      self.registration.showNotification(title, {
        body,
        icon:  '/iuea_logo.png',
        badge: '/iuea_logo.png',
        data:  payload.data ?? {},
      });
    });
  } catch {
    // Silently swallow — Firebase config may not be set in dev
  }
});
