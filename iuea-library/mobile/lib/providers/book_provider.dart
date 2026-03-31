import 'package:flutter/foundation.dart';
import '../data/models/book_model.dart';
import '../data/repositories/book_repository.dart';
import '../data/services/api_service.dart';

class BookProvider extends ChangeNotifier {
  List<BookModel> _featured        = [];
  List<BookModel> _newestBooks     = [];
  List<BookModel> _popularBooks    = [];
  List<BookModel> _continueReading = [];
  List<BookModel> _searchResults   = [];
  List<BookModel> _externalResults = [];
  BookModel?      _current;
  bool            _isLoading    = false;
  bool            _searchLoading = false;
  String?         _error;

  List<BookModel> get featured        => _featured;
  List<BookModel> get newestBooks     => _newestBooks;
  List<BookModel> get popularBooks    => _popularBooks;
  List<BookModel> get continueReading => _continueReading;
  List<BookModel> get searchResults   => _searchResults;
  List<BookModel> get externalResults => _externalResults;
  BookModel?      get current         => _current;
  bool            get isLoading       => _isLoading;
  bool            get searchLoading   => _searchLoading;
  String?         get error           => _error;

  final BookRepository _repo = BookRepository(ApiService());

  // ── loadFeatured ─────────────────────────────────────────────────────────────
  Future<void> loadFeatured() async {
    _setLoading(true);
    try {
      _featured = await _repo.getFeatured();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // ── loadContinueReading ───────────────────────────────────────────────────────
  Future<void> loadContinueReading() async {
    try {
      _continueReading = await _repo.getContinueReading();
      notifyListeners();
    } catch {
      // Silently ignore — user may not be authenticated
    }
  }

  // ── loadNewest ────────────────────────────────────────────────────────────────
  Future<void> loadNewest() async {
    try {
      _newestBooks = await _repo.getBooks(filters: {'sort': 'newest', 'limit': 10});
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  // ── loadPopular ───────────────────────────────────────────────────────────────
  Future<void> loadPopular() async {
    try {
      _popularBooks = await _repo.getBooks(filters: {'sort': 'popular', 'limit': 10});
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  // ── loadBooks (general browse/search) ────────────────────────────────────────
  Future<void> loadBooks({String? category, String? language, String? faculty, int page = 1}) async {
    _setLoading(true);
    try {
      _newestBooks = await _repo.getBooks(filters: {
        if (category != null) 'category': category,
        if (language != null) 'language': language,
        if (faculty  != null) 'faculty':  faculty,
        'page': page,
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // ── searchBooks ───────────────────────────────────────────────────────────────
  Future<void> searchBooks(String query, {String? category, String? language, String? faculty}) async {
    _searchLoading = true;
    _searchResults   = [];
    _externalResults = [];
    notifyListeners();
    try {
      final result = await _repo.searchBooks(query,
        category: category, language: language, faculty: faculty);
      _searchResults   = result['books']    as List<BookModel>;
      _externalResults = result['external'] as List<BookModel>;
    } catch (e) {
      _error = e.toString();
    } finally {
      _searchLoading = false;
      notifyListeners();
    }
  }

  // ── getBook ───────────────────────────────────────────────────────────────────
  Future<BookModel?> getBook(String id) async {
    _setLoading(true);
    try {
      _current = await _repo.getBookById(id);
      notifyListeners();
      return _current;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // ── getSimilarBooks ───────────────────────────────────────────────────────────
  Future<List<BookModel>> getSimilarBooks(String id) async {
    return _repo.getSimilar(id);
  }

  // ── clearSearch ───────────────────────────────────────────────────────────────
  void clearSearch() {
    _searchResults   = [];
    _externalResults = [];
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    _error     = null;
    notifyListeners();
  }
}
