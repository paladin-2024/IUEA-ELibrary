import 'book_model.dart';

class ProgressModel {
  final String       id;
  final String       userId;
  final String       bookId;
  final BookModel?   book;             // populated when API returns with book object
  final int          currentPage;
  final int          currentChapter;
  final String?      currentCfi;       // EPUB CFI — restores position on web + mobile
  final double       percentComplete;
  final List<int>    bookmarks;
  final List<Map<String, dynamic>> highlights;
  final String       readingLanguage;
  final int          totalReadingMinutes;
  final bool         isCompleted;
  final DateTime?    lastReadAt;
  final String       lastDevice;       // mobile | web

  const ProgressModel({
    required this.id,
    required this.userId,
    required this.bookId,
    this.book,
    this.currentPage          = 0,
    this.currentChapter       = 0,
    this.currentCfi,
    this.percentComplete      = 0.0,
    this.bookmarks            = const [],
    this.highlights           = const [],
    this.readingLanguage      = 'English',
    this.totalReadingMinutes  = 0,
    this.isCompleted          = false,
    this.lastReadAt,
    this.lastDevice           = 'mobile',
  });

  factory ProgressModel.fromJson(Map<String, dynamic> json) {
    final bookData = json['bookId'] ?? json['book'];

    final String resolvedBookId = bookData is String
        ? bookData
        : (bookData as Map<String, dynamic>?)?['_id'] as String? ?? '';

    final BookModel? resolvedBook = bookData is Map<String, dynamic>
        ? BookModel.fromJson(bookData)
        : null;

    return ProgressModel(
      id:     json['_id']    as String? ?? json['id'] as String? ?? '',
      userId: json['userId'] as String? ??
              (json['userId'] is Map
                  ? (json['userId'] as Map)['_id'] as String
                  : ''),
      bookId: resolvedBookId,
      book:   resolvedBook,
      currentPage:     (json['currentPage']    as num?)?.toInt()    ?? 0,
      currentChapter:  (json['currentChapter'] as num?)?.toInt()    ?? 0,
      currentCfi:       json['currentCfi']      as String?,
      percentComplete: (json['percentComplete'] as num?)?.toDouble() ?? 0.0,
      bookmarks: (json['bookmarks'] as List<dynamic>?)
              ?.map((e) => (e as num).toInt())
              .toList() ??
          [],
      highlights: (json['highlights'] as List<dynamic>?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList() ??
          [],
      readingLanguage:     json['readingLanguage']    as String? ?? 'English',
      totalReadingMinutes: (json['totalReadingMinutes'] as num?)?.toInt() ?? 0,
      isCompleted:          json['isCompleted']        as bool?   ?? false,
      lastReadAt: json['lastReadAt'] != null
          ? DateTime.tryParse(json['lastReadAt'] as String)
          : null,
      lastDevice: json['lastDevice'] as String? ?? 'mobile',
    );
  }

  Map<String, dynamic> toJson() => {
    '_id':                  id,
    'userId':               userId,
    'bookId':               bookId,
    'currentPage':          currentPage,
    'currentChapter':       currentChapter,
    if (currentCfi != null) 'currentCfi': currentCfi,
    'percentComplete':      percentComplete,
    'bookmarks':            bookmarks,
    'highlights':           highlights,
    'readingLanguage':      readingLanguage,
    'totalReadingMinutes':  totalReadingMinutes,
    'isCompleted':          isCompleted,
    if (lastReadAt != null) 'lastReadAt': lastReadAt!.toIso8601String(),
    'lastDevice':           lastDevice,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  /// 0–100 int for display
  int get percentInt => percentComplete.round().clamp(0, 100);
}
