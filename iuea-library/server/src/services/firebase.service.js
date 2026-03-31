const { getMessaging } = require('../config/firebase');

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!token) return null;
  const message = {
    token,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: { priority: 'high' },
    apns:    { payload: { aps: { sound: 'default' } } },
  };
  try {
    const response = await getMessaging().send(message);
    return response;
  } catch (err) {
    console.error('FCM error:', err.message);
    return null;
  }
};

const sendMulticast = async ({ tokens, title, body, data = {} }) => {
  if (!tokens?.length) return null;
  const message = {
    tokens,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
  };
  try {
    return await getMessaging().sendEachForMulticast(message);
  } catch (err) {
    console.error('FCM multicast error:', err.message);
    return null;
  }
};

module.exports = { sendPushNotification, sendMulticast };
