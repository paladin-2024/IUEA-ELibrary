import { useEffect } from 'react';
import useAuthStore  from '../store/authStore';

/**
 * useFcm — initialises Firebase Cloud Messaging for web push notifications
 * and registers the FCM token with the backend when the user is logged in.
 *
 * Requires: VITE_FIREBASE_VAPID_KEY in env and firebase configured in main.jsx.
 */
export default function useFcm() {
  const { user, updateFcmToken } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    async function register() {
      try {
        // Dynamic import so the app still loads in environments without
        // ServiceWorker support (e.g. Safari private mode).
        const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
        const { app } = await import('../firebase');

        const messaging = getMessaging(app);

        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        });

        if (token) {
          await updateFcmToken(token);
        }

        // Foreground message handler — show a toast or in-app notification
        const { default: toast } = await import('react-hot-toast');
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? 'New notification';
          const body  = payload.notification?.body  ?? '';
          toast(`${title}${body ? ` — ${body}` : ''}`);
        });
      } catch {
        // FCM is best-effort — silently swallow errors
      }
    }

    register();
  }, [user, updateFcmToken]);
}
