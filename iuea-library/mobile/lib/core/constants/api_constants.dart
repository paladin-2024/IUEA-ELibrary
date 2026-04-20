import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  ApiConstants._();

  static String get baseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:5000/api';

  // ── Auth ───────────────────────────────────────────────────────────────────
  static String get authLogin    => '$baseUrl/auth/login';
  static String get authRegister => '$baseUrl/auth/register';
  static String get authGoogle   => '$baseUrl/auth/google';
  static String get authMe       => '$baseUrl/auth/me';
  static String get authFcmToken        => '$baseUrl/auth/fcm-token';
  static String get authForgotPassword  => '$baseUrl/auth/forgot-password';
  static String get authResetPassword   => '$baseUrl/auth/reset-password';

  // ── Books ──────────────────────────────────────────────────────────────────
  static String get books          => '$baseUrl/books';
  static String get bookSearch     => '$baseUrl/books/search';
  static String get bookFeatured   => '$baseUrl/books/featured';
  static String get bookContinue   => '$baseUrl/books/continue';
  static String bookDetail(String id)  => '$baseUrl/books/$id';
  static String bookSimilar(String id) => '$baseUrl/books/$id/similar';

  // ── Progress ───────────────────────────────────────────────────────────────
  static String get allProgress         => '$baseUrl/progress';
  static String progress(String bookId) => '$baseUrl/progress/$bookId';

  // ── Chat ───────────────────────────────────────────────────────────────────
  static String chat(String bookId)        => '$baseUrl/chat/$bookId';
  static String chatStream(String bookId)  => '$baseUrl/chat/$bookId/stream';
  static String chatHistory(String bookId) => '$baseUrl/chat/$bookId/history';

  // ── Audio ──────────────────────────────────────────────────────────────────
  static String get audioGenerate => '$baseUrl/audio/generate';

  // ── Translation ────────────────────────────────────────────────────────────
  static String get translate => '$baseUrl/translate';

  // ── Podcasts ───────────────────────────────────────────────────────────────
  static String get podcasts                    => '$baseUrl/podcasts';
  static String get podcastSubscriptions        => '$baseUrl/podcasts/subscriptions';
  static String podcastDetail(String id)        => '$baseUrl/podcasts/$id';
  static String podcastSubscribe(String id)     => '$baseUrl/podcasts/subscribe/$id';
  static String podcastPlay(String id)          => '$baseUrl/podcasts/$id/play';

  // ── Borrowing ──────────────────────────────────────────────────────────────
  static String get borrowing              => '$baseUrl/borrowing';
  static String get myLoans               => '$baseUrl/borrowing/my';
  static String cancelLoan(String id)     => '$baseUrl/borrowing/$id';
  static String renewLoan(String id)      => '$baseUrl/borrowing/$id/renew';

  // ── Reviews ────────────────────────────────────────────────────────────────
  static String reviews(String bookId)    => '$baseUrl/reviews/$bookId';
  static String myReview(String bookId)   => '$baseUrl/reviews/my/$bookId';
  static String reviewHelpful(String bookId) => '$baseUrl/reviews/$bookId/helpful';

  // ── Streaks ────────────────────────────────────────────────────────────────
  static String get streaks               => '$baseUrl/streaks';
}
