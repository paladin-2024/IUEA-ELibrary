import 'package:flutter/foundation.dart';
import '../data/models/book_model.dart';
import '../data/models/progress_model.dart';
import '../data/repositories/progress_repository.dart';
import '../data/services/api_service.dart';
import '../data/services/tts_service.dart';
import '../core/constants/api_constants.dart';

enum ReaderTheme { light, sepia, dark }
enum ReaderMode  { read, audio }

class ReaderProvider extends ChangeNotifier {
  // ── Book ─────────────────────────────────────────────────────────────────
  BookModel?      _book;
  ProgressModel?  _progress;

  // ── Position ─────────────────────────────────────────────────────────────
  int    _currentPage    = 0;
  int    _totalPages     = 0;
  double _percentComplete = 0;
  String _currentCfi     = '';
  String _currentChapter = '';

  // ── Mode ─────────────────────────────────────────────────────────────────
  ReaderMode  _mode            = ReaderMode.read;
  String      _readingLanguage = 'en';

  // ── Translation ───────────────────────────────────────────────────────────
  bool    _isTranslating      = false;
  String? _translatedContent;

  // ── Display ───────────────────────────────────────────────────────────────
  ReaderTheme _theme      = ReaderTheme.light;
  double      _fontSize   = 18;
  double      _lineHeight = 1.6;

  // ── Audio ─────────────────────────────────────────────────────────────────
  bool   _isTtsPlaying = false;
  bool   _isTtsPaused  = false;
  double _playbackSpeed = 1.0;

  // ── UI ─────────────────────────────────────────────────────────────────────
  bool _showTOC        = false;
  bool _isChatOpen     = false;

  // Getters
  BookModel?     get book              => _book;
  ProgressModel? get progress          => _progress;
  int            get currentPage       => _currentPage;
  int            get totalPages        => _totalPages;
  double         get percentComplete   => _percentComplete;
  String         get currentCfi        => _currentCfi;
  String         get currentChapter    => _currentChapter;
  ReaderMode     get mode              => _mode;
  String         get readingLanguage   => _readingLanguage;
  bool           get isTranslating     => _isTranslating;
  String?        get translatedContent => _translatedContent;
  ReaderTheme    get theme             => _theme;
  double         get fontSize          => _fontSize;
  double         get lineHeight        => _lineHeight;
  bool           get isTtsPlaying      => _isTtsPlaying;
  bool           get isTtsPaused       => _isTtsPaused;
  double         get playbackSpeed     => _playbackSpeed;
  bool           get showTOC           => _showTOC;
  bool           get isChatOpen        => _isChatOpen;

  final ProgressRepository _progressRepo = ProgressRepository(ApiService());
  final TtsService         _tts          = TtsService();

  // ── Book / Mode ───────────────────────────────────────────────────────────
  void setBook(BookModel book) {
    _book = book;
    notifyListeners();
  }

  void setMode(ReaderMode mode) {
    _mode = mode;
    notifyListeners();
  }

  // ── Position ─────────────────────────────────────────────────────────────
  void setPage(int page, int total) {
    _currentPage    = page;
    _totalPages     = total;
    _percentComplete = total > 0 ? (page / total * 100) : 0;
    notifyListeners();
  }

  void setCfi(String cfi) {
    _currentCfi = cfi;
    notifyListeners();
  }

  void setChapter(String chapter) {
    if (_currentChapter == chapter) return;
    _currentChapter  = chapter;
    _translatedContent = null;   // clear translation on chapter change
    notifyListeners();
  }

  // ── Display ───────────────────────────────────────────────────────────────
  void setTheme(ReaderTheme theme) {
    _theme = theme;
    notifyListeners();
  }

  void setFontSize(double size) {
    _fontSize = size.clamp(12, 28);
    notifyListeners();
  }

  void setLineHeight(double lh) {
    _lineHeight = lh.clamp(1.2, 2.5);
    notifyListeners();
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  void toggleTOC() {
    _showTOC = !_showTOC;
    notifyListeners();
  }

  void toggleChat() {
    _isChatOpen = !_isChatOpen;
    notifyListeners();
  }

  // ── Progress ─────────────────────────────────────────────────────────────
  Future<void> loadProgress() async {
    if (_book == null) return;
    try {
      final p = await _progressRepo.getProgress(_book!.id);
      if (p != null) {
        _progress        = p;
        _currentPage     = p.currentPage;
        _percentComplete = p.percentComplete;
        _currentCfi      = p.currentCfi ?? '';
        _readingLanguage = p.readingLanguage.toLowerCase().contains('en') ? 'en' : p.readingLanguage;
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<void> saveProgress() async {
    if (_book == null) return;
    try {
      await _progressRepo.saveProgress(
        _book!.id,
        currentPage:     _currentPage,
        totalPages:      _totalPages,
        currentCfi:      _currentCfi.isNotEmpty ? _currentCfi : null,
        percentComplete: _percentComplete,
        currentChapter:  _currentChapter.isNotEmpty ? _currentChapter : null,
        readingLanguage: _readingLanguage,
        device:          'mobile',
      );
    } catch (_) {}
  }

  // ── Translation ───────────────────────────────────────────────────────────
  Future<void> translateCurrentChapter(String text, String targetLanguage) async {
    if (text.isEmpty || targetLanguage == 'en') {
      _translatedContent = null;
      notifyListeners();
      return;
    }
    _isTranslating = true;
    notifyListeners();
    try {
      final api      = ApiService();
      final response = await api.post(
        ApiConstants.translate,
        data: {
          'text':            text,
          'targetLanguage':  targetLanguage,
          'sourceLanguage':  'en',
        },
      );
      _translatedContent = response.data['translated'] as String?;
      _readingLanguage   = targetLanguage;
    } catch (_) {
      _translatedContent = null;
    } finally {
      _isTranslating = false;
      notifyListeners();
    }
  }

  void clearTranslation() {
    _translatedContent = null;
    _readingLanguage   = 'en';
    notifyListeners();
  }

  // ── TTS ───────────────────────────────────────────────────────────────────
  Future<void> speakCurrentChapter(String text) async {
    if (_isTtsPlaying) {
      await _tts.stop();
      _isTtsPlaying = false;
      _isTtsPaused  = false;
      notifyListeners();
      return;
    }
    if (_isTtsPaused) {
      // flutter_tts doesn't support true resume — restart
      _isTtsPaused = false;
    }
    await _tts.speak(
      _translatedContent ?? text,
      language: _readingLanguage == 'en' ? 'en-US' : _readingLanguage,
      rate:     _playbackSpeed,
      onProgress: (start, length) {
        // Could emit word-level events if needed
      },
    );
    _isTtsPlaying = true;
    notifyListeners();
  }

  Future<void> stopSpeaking() async {
    await _tts.stop();
    _isTtsPlaying = false;
    _isTtsPaused  = false;
    notifyListeners();
  }

  Future<void> setPlaybackSpeed(double speed) async {
    _playbackSpeed = speed;
    if (_isTtsPlaying) await _tts.setRate(speed);
    notifyListeners();
  }

  @override
  void dispose() {
    _tts.dispose();
    super.dispose();
  }
}
