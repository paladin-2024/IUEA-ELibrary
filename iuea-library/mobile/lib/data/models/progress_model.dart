import 'book_model.dart';

class ProgressModel {
  final String     id;
  final BookModel? book;
  final String     bookId;
  final int        currentPage;
  final String     currentCfi;
  final int        totalPages;
  final double     percentage;
  final bool       isCompleted;
  final DateTime   lastReadAt;

  const ProgressModel({
    required this.id,
    this.book,
    required this.bookId,
    this.currentPage = 0,
    this.currentCfi  = '',
    this.totalPages  = 0,
    this.percentage  = 0,
    this.isCompleted = false,
    required this.lastReadAt,
  });

  factory ProgressModel.fromJson(Map<String, dynamic> json) {
    final bookData = json['book'];
    return ProgressModel(
      id:          json['_id']         as String,
      book:        bookData is Map<String, dynamic> ? BookModel.fromJson(bookData) : null,
      bookId:      bookData is String  ? bookData : (bookData as Map<String, dynamic>?)?['_id'] as String? ?? '',
      currentPage: (json['currentPage'] as num?)?.toInt() ?? 0,
      currentCfi:   json['currentCfi']  as String? ?? '',
      totalPages:  (json['totalPages']  as num?)?.toInt() ?? 0,
      percentage:  (json['percentage']  as num?)?.toDouble() ?? 0,
      isCompleted:  json['isCompleted'] as bool? ?? false,
      lastReadAt:   DateTime.parse(json['lastReadAt'] as String? ?? DateTime.now().toIso8601String()),
    );
  }
}
