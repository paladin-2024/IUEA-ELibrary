import '../models/book_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class BookRepository {
  final ApiService _api;
  BookRepository(this._api);

  // ── getBooks ────────────────────────────────────────────────────────────────
  Future<List<BookModel>> getBooks({Map<String, dynamic>? filters}) async {
    final response = await _api.get(ApiConstants.books, params: filters);
    return (response.data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  // ── getFeatured ─────────────────────────────────────────────────────────────
  Future<List<BookModel>> getFeatured() async {
    final response = await _api.get(ApiConstants.bookFeatured);
    return (response.data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  // ── getContinueReading ──────────────────────────────────────────────────────
  Future<List<BookModel>> getContinueReading() async {
    final response = await _api.get(ApiConstants.bookContinue);
    return (response.data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  // ── searchBooks ─────────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> searchBooks(
    String query, {
    String? category,
    String? language,
    String? faculty,
    int page = 1,
  }) async {
    final response = await _api.get(ApiConstants.bookSearch, params: {
      'q':    query,
      'page': page,
      if (category != null) 'category': category,
      if (language != null) 'language': language,
      if (faculty  != null) 'faculty':  faculty,
    });
    final books = (response.data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
    final external = (response.data['external'] as List<dynamic>? ?? [])
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
    return {'books': books, 'external': external};
  }

  // ── getBookById ─────────────────────────────────────────────────────────────
  Future<BookModel> getBookById(String id) async {
    final response = await _api.get(ApiConstants.bookDetail(id));
    return BookModel.fromJson(response.data['book'] as Map<String, dynamic>);
  }

  // ── getSimilar ──────────────────────────────────────────────────────────────
  Future<List<BookModel>> getSimilar(String id) async {
    final response = await _api.get(ApiConstants.bookSimilar(id));
    return (response.data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }
}
