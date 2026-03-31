import 'package:flutter/foundation.dart';
import '../data/models/book_model.dart';
import '../data/repositories/book_repository.dart';
import '../data/services/api_service.dart';

class BookProvider extends ChangeNotifier {
  List<BookModel> _featured  = [];
  List<BookModel> _books     = [];
  List<BookModel> _search    = [];
  BookModel?      _current;
  bool            _isLoading = false;
  String?         _error;

  List<BookModel> get featured   => _featured;
  List<BookModel> get books      => _books;
  List<BookModel> get searchResults => _search;
  BookModel?      get current    => _current;
  bool            get isLoading  => _isLoading;
  String?         get error      => _error;

  final BookRepository _repo = BookRepository(ApiService());

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

  Future<void> loadBooks({String? category, String? language, int page = 1}) async {
    _setLoading(true);
    try {
      _books = await _repo.listBooks(category: category, language: language, page: page);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> searchBooks(String query, {String? category}) async {
    _setLoading(true);
    try {
      _search = await _repo.search(query, category: category);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<BookModel?> getBook(String id) async {
    _setLoading(true);
    try {
      _current = await _repo.getBook(id);
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

  void clearSearch() {
    _search = [];
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    _error     = null;
    notifyListeners();
  }
}
