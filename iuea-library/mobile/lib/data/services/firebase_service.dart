import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'api_service.dart';
import '../../core/constants/api_constants.dart';

// Background handler must be a top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background messages are handled by the service worker on web
  // and by the OS notification tray on mobile — no action needed here
}

class FirebaseService {
  final FirebaseMessaging            _messaging    = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotif = FlutterLocalNotificationsPlugin();
  final ApiService _api;

  FirebaseService(this._api);

  // ── Initialise ──────────────────────────────────────────────────────────────
  Future<void> init(BuildContext context) async {
    await requestPermission();
    _initLocalNotifications();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Send token to backend
    final token = await getToken();
    if (token != null) await _sendTokenToBackend(token);

    // Refresh token listener
    _messaging.onTokenRefresh.listen(_sendTokenToBackend);

    // Foreground messages
    FirebaseMessaging.onMessage.listen((msg) => _handleForeground(msg));

    // Tapped from notification tray
    FirebaseMessaging.onMessageOpenedApp.listen((msg) => _navigate(context, msg));

    // App launched from terminated state via notification
    final initial = await _messaging.getInitialMessage();
    if (initial != null && context.mounted) _navigate(context, initial);
  }

  // ── Permission ──────────────────────────────────────────────────────────────
  Future<void> requestPermission() async {
    await _messaging.requestPermission(
      alert:       true,
      badge:       true,
      sound:       true,
      provisional: false,
    );
  }

  // ── Token ───────────────────────────────────────────────────────────────────
  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (_) {
      return null;
    }
  }

  Future<void> _sendTokenToBackend(String token) async {
    try {
      await _api.post(ApiConstants.authFcmToken, data: {'token': token, 'platform': 'mobile'});
    } catch (_) {
      // Non-critical
    }
  }

  // ── Local notifications setup ───────────────────────────────────────────────
  void _initLocalNotifications() {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios     = DarwinInitializationSettings();
    _localNotif.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );
  }

  void _handleForeground(RemoteMessage message) {
    final n = message.notification;
    if (n == null) return;

    _localNotif.show(
      message.hashCode,
      n.title,
      n.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'iuea_channel', 'IUEA Library',
          importance: Importance.high,
          priority:   Priority.high,
          color:      const Color(0xFF7B0D1E),
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }

  // ── Navigation from notification tap ───────────────────────────────────────
  void _navigate(BuildContext context, RemoteMessage message) {
    final type   = message.data['type']   as String?;
    final bookId = message.data['bookId'] as String?;

    if (!context.mounted) return;

    switch (type) {
      case 'new_book':
        if (bookId != null) context.push('/books/$bookId');
      case 'reading_reminder':
        if (bookId != null) context.push('/reader/$bookId');
      case 'weekly_digest':
        context.push('/profile');
      default:
        context.push('/home');
    }
  }
}
