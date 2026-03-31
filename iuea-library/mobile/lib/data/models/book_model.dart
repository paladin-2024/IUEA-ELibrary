class BookModel {
  final String       id;
  final String       title;
  final List<String> author;
  final String       description;
  final String       category;
  final String       language;
  final String       coverUrl;
  final String       fileUrl;
  final String       fileType;
  final int          pageCount;
  final String?      publishedYear;
  final String?      publisher;
  final String?      isbn;
  final List<String> tags;
  final bool         isFeatured;
  final int          viewCount;

  const BookModel({
    required this.id,
    required this.title,
    required this.author,
    this.description  = '',
    this.category     = '',
    this.language     = 'en',
    this.coverUrl     = '',
    this.fileUrl      = '',
    this.fileType     = 'pdf',
    this.pageCount    = 0,
    this.publishedYear,
    this.publisher,
    this.isbn,
    this.tags         = const [],
    this.isFeatured   = false,
    this.viewCount    = 0,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) {
    return BookModel(
      id:          json['_id']          as String,
      title:       json['title']        as String,
      author:      (json['author']      as List<dynamic>?)?.cast<String>() ?? [],
      description: json['description']  as String? ?? '',
      category:    json['category']     as String? ?? '',
      language:    json['language']     as String? ?? 'en',
      coverUrl:    json['coverUrl']     as String? ?? '',
      fileUrl:     json['fileUrl']      as String? ?? '',
      fileType:    json['fileType']     as String? ?? 'pdf',
      pageCount:   (json['pageCount']   as num?)?.toInt() ?? 0,
      publishedYear: json['publishedYear']?.toString(),
      publisher:   json['publisher']    as String?,
      isbn:        json['isbn']         as String?,
      tags:        (json['tags']        as List<dynamic>?)?.cast<String>() ?? [],
      isFeatured:  json['isFeatured']   as bool? ?? false,
      viewCount:   (json['viewCount']   as num?)?.toInt() ?? 0,
    );
  }

  String get authorDisplay => author.join(', ');
}
