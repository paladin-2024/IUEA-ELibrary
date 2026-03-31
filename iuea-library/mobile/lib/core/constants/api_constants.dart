import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  ApiConstants._();

  static String get baseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:5000/api';

  // Auth
  static const String login     = '/auth/login';
  static const String register  = '/auth/register';
  static const String googleAuth= '/auth/google';
  static const String me        = '/auth/me';
  static const String fcmToken  = '/auth/fcm-token';

  // Books
  static const String books     = '/books';
  static const String featured  = '/books/featured';
  static const String search    = '/books/search';
  static String bookDetail(String id)  => '/books/$id';
  static String bookSimilar(String id) => '/books/$id/similar';

  // Progress
  static const String allProgress      = '/progress';
  static String progress(String bookId) => '/progress/$bookId';

  // Chat
  static String chat(String bookId)        => '/chat/$bookId';
  static String chatHistory(String bookId) => '/chat/$bookId/history';

  // Audio
  static const String generateAudio = '/audio/generate';

  // Translation
  static const String translate = '/translate';

  // Podcasts
  static const String podcasts                    = '/podcasts';
  static String podcastDetail(String id)          => '/podcasts/$id';
  static String podcastSubscribe(String id)       => '/podcasts/subscribe/$id';
}
