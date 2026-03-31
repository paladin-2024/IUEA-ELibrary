import '../models/book_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class BookRepository {
  final ApiService _api;
  BookRepository(this._api);

  Future<List<BookModel>> listBooks({String? category, String? language, int page = 1, int limit = 20}) async {
    final data = await _api.get(ApiConstants.books, params: {
      if (category != null) 'category': category,
      if (language != null) 'language': language,
      'page':  page,
      'limit': limit,
    });
    return (data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  Future<List<BookModel>> getFeatured() async {
    final data = await _api.get(ApiConstants.featured);
    return (data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  Future<List<BookModel>> search(String query, {String? category, String? language, int page = 1}) async {
    final data = await _api.get(ApiConstants.search, params: {
      'q':     query,
      'page':  page,
      'limit': 20,
      if (category != null) 'category': category,
      if (language != null) 'language': language,
    });
    return (data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }

  Future<BookModel> getBook(String id) async {
    final data = await _api.get(ApiConstants.bookDetail(id));
    return BookModel.fromJson(data['book'] as Map<String, dynamic>);
  }

  Future<List<BookModel>> getSimilar(String id) async {
    final data = await _api.get(ApiConstants.bookSimilar(id));
    return (data['books'] as List<dynamic>)
        .map((b) => BookModel.fromJson(b as Map<String, dynamic>))
        .toList();
  }
}
