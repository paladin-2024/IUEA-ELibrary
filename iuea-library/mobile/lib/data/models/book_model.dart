class BookModel {
  final String       id;
  final String       title;
  final String       author;           // single string from API
  final String?      kohaId;
  final String?      isbn;
  final String?      coverUrl;         // Open Library URL
  final String?      fileUrl;          // R2 path — EPUB or PDF
  final String?      archiveId;        // Internet Archive identifier
  final String?      description;
  final String       category;
  final String?      fileFormat;       // epub | pdf | html | external
  final List<String> faculty;
  final List<String> languages;
  final List<String> tags;
  final int?         publishedYear;
  final int?         pageCount;
  final double       rating;
  final int          ratingCount;
  final bool         isActive;
  final Map<String, dynamic>? availability; // { total, available, checkedOut }

  const BookModel({
    required this.id,
    required this.title,
    required this.author,
    this.kohaId,
    this.isbn,
    this.coverUrl,
    this.fileUrl,
    this.archiveId,
    this.description,
    this.category     = 'General',
    this.fileFormat,
    this.faculty      = const [],
    this.languages    = const ['English'],
    this.tags         = const [],
    this.publishedYear,
    this.pageCount,
    this.rating       = 0.0,
    this.ratingCount  = 0,
    this.isActive     = true,
    this.availability,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) {
    // author may come as String or List from different API responses
    final rawAuthor = json['author'];
    final String authorStr = rawAuthor is List
        ? (rawAuthor as List<dynamic>).cast<String>().join(', ')
        : (rawAuthor as String? ?? 'Unknown');

    return BookModel(
      id:           json['_id']          as String? ?? json['id'] as String,
      title:        json['title']        as String,
      author:       authorStr,
      kohaId:       json['kohaId']       as String?,
      isbn:         json['isbn']         as String?,
      coverUrl:     json['coverUrl']     as String?,
      fileUrl:      json['fileUrl']      as String?,
      archiveId:    json['archiveId']    as String?,
      description:  json['description'] as String?,
      category:     json['category']    as String? ?? 'General',
      fileFormat:   json['fileFormat']  as String?,
      faculty:   (json['faculty']   as List<dynamic>?)?.cast<String>() ?? [],
      languages: (json['languages'] as List<dynamic>?)?.cast<String>() ?? ['English'],
      tags:      (json['tags']      as List<dynamic>?)?.cast<String>() ?? [],
      publishedYear: (json['publishedYear'] as num?)?.toInt(),
      pageCount:     (json['pageCount']     as num?)?.toInt(),
      rating:       (json['rating']         as num?)?.toDouble() ?? 0.0,
      ratingCount:  (json['ratingCount']    as num?)?.toInt()    ?? 0,
      isActive:      json['isActive']       as bool? ?? true,
      availability:  json['availability']   as Map<String, dynamic>?,
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  String get authorDisplay => author;

  /// Number of languages this book is available in
  int get languageCount => languages.length;

  bool get hasFile => fileUrl != null && fileUrl!.isNotEmpty;
  bool get hasCover => coverUrl != null && coverUrl!.isNotEmpty;
}
