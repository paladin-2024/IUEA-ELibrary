import 'dart:convert';
import 'package:http/http.dart' as http;
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
    // Run server search and Google Books in parallel
    final results = await Future.wait([
      _searchServer(query, category: category, language: language, faculty: faculty, page: page),
      _searchGoogleBooks(query, category: category),
    ]);

    final serverResult = results[0] as Map<String, dynamic>;
    final googleBooks  = results[1] as List<BookModel>;

    final serverBooks    = serverResult['books']    as List<BookModel>;
    final serverExternal = serverResult['external'] as List<BookModel>;

    // Deduplicate Google Books against server results by title
    final knownTitles = {
      ...serverBooks.map((b) => b.title.toLowerCase()),
      ...serverExternal.map((b) => b.title.toLowerCase()),
    };
    final uniqueGoogle = googleBooks
        .where((b) => !knownTitles.contains(b.title.toLowerCase()))
        .toList();

    return {
      'books':    serverBooks,
      'external': [...serverExternal, ...uniqueGoogle],
    };
  }

  Future<Map<String, dynamic>> _searchServer(
    String query, {
    String? category,
    String? language,
    String? faculty,
    int page = 1,
  }) async {
    try {
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
    } catch (_) {
      return {'books': <BookModel>[], 'external': <BookModel>[]};
    }
  }

  // ── Google Books API (unlimited public access, no key needed) ───────────────
  Future<List<BookModel>> _searchGoogleBooks(String query, {String? category}) async {
    try {
      final q = category != null && category != 'All'
          ? Uri.encodeComponent('$query+subject:$category')
          : Uri.encodeComponent(query);
      final res = await http.get(
        Uri.parse('https://www.googleapis.com/books/v1/volumes?q=$q&maxResults=40&printType=books'),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode != 200) return [];

      final data  = jsonDecode(res.body) as Map<String, dynamic>;
      final items = data['items'] as List<dynamic>? ?? [];

      return items.map((item) {
        final info   = item['volumeInfo'] as Map<String, dynamic>? ?? {};
        final images = info['imageLinks'] as Map<String, dynamic>? ?? {};
        final rawThumb = (images['thumbnail'] ?? images['smallThumbnail'] ?? '') as String;
        final thumb    = rawThumb.replaceFirst('http://', 'https://');
        final authors  = (info['authors'] as List<dynamic>?)?.cast<String>() ?? ['Unknown'];
        final cats     = (info['categories'] as List<dynamic>?)?.cast<String>() ?? [];
        final year     = info['publishedDate'] as String?;

        return BookModel(
          id:           'gb-${item['id']}',
          title:        info['title'] as String? ?? 'Unknown Title',
          author:       authors.join(', '),
          coverUrl:     thumb.isNotEmpty ? thumb : null,
          description:  info['description'] as String?,
          category:     cats.isNotEmpty ? cats.first : (category ?? 'General'),
          fileUrl:      info['previewLink'] as String?,
          fileFormat:   'external',
          publishedYear: year != null ? int.tryParse(year.substring(0, 4.clamp(0, year.length))) : null,
          pageCount:    info['pageCount'] as int?,
          languages:    [(info['language'] as String? ?? 'en').toUpperCase()],
          isActive:     true,
        );
      }).where((b) => b.coverUrl != null).toList();
    } catch (_) {
      return [];
    }
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
