import 'package:flutter/foundation.dart';
import '../data/models/book_model.dart';
import '../data/repositories/progress_repository.dart';
import '../data/services/api_service.dart';
import '../data/services/tts_service.dart';

enum ReaderTheme { light, sepia, dark }

class ReaderProvider extends ChangeNotifier {
  BookModel?   _book;
  int          _currentPage  = 0;
  int          _totalPages   = 0;
  double       _percentage   = 0;
  String       _currentCfi   = '';
  ReaderTheme  _theme        = ReaderTheme.light;
  double       _fontSize     = 16;
  bool         _isTtsPlaying = false;
  bool         _isChatOpen   = false;

  BookModel?   get book          => _book;
  int          get currentPage   => _currentPage;
  int          get totalPages    => _totalPages;
  double       get percentage    => _percentage;
  ReaderTheme  get theme         => _theme;
  double       get fontSize      => _fontSize;
  bool         get isTtsPlaying  => _isTtsPlaying;
  bool         get isChatOpen    => _isChatOpen;

  final ProgressRepository _progressRepo = ProgressRepository(ApiService());
  final TtsService         _tts          = TtsService();

  void setBook(BookModel book) {
    _book = book;
    notifyListeners();
  }

  void setPage(int page, int total) {
    _currentPage = page;
    _totalPages  = total;
    _percentage  = total > 0 ? (page / total * 100) : 0;
    notifyListeners();
  }

  void setCfi(String cfi) {
    _currentCfi = cfi;
    notifyListeners();
  }

  void setTheme(ReaderTheme theme) {
    _theme = theme;
    notifyListeners();
  }

  void setFontSize(double size) {
    _fontSize = size.clamp(12, 28);
    notifyListeners();
  }

  void toggleChat() {
    _isChatOpen = !_isChatOpen;
    notifyListeners();
  }

  Future<void> toggleTts(String text, {String language = 'en-US', double speed = 1.0}) async {
    if (_isTtsPlaying) {
      await _tts.stop();
      _isTtsPlaying = false;
    } else {
      await _tts.speak(text, language: language, rate: speed);
      _isTtsPlaying = true;
    }
    notifyListeners();
  }

  Future<void> saveProgress() async {
    if (_book == null) return;
    try {
      await _progressRepo.saveProgress(
        _book!.id,
        currentPage: _currentPage,
        totalPages:  _totalPages,
        currentCfi:  _currentCfi,
        percentage:  _percentage,
      );
    } catch (_) {}
  }

  @override
  void dispose() {
    _tts.dispose();
    super.dispose();
  }
}
