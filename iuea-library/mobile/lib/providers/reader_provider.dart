import 'dart:async';
import 'package:flutter/foundation.dart';
import '../data/models/book_model.dart';
import '../data/services/api_service.dart';
import '../data/services/tts_service.dart';
import '../core/constants/api_constants.dart';

// Language name → BCP-47 code (mirrors server langMap)
const _langMap = {
  'English':     'en-US',
  'Swahili':     'sw-KE',
  'French':      'fr-FR',
  'Arabic':      'ar-SA',
  'Luganda':     'lg',
  'Kinyarwanda': 'rw',
  'Somali':      'so',
  'Amharic':     'am-ET',
};

String _getLangCode(String name) => _langMap[name] ?? 'en-US';

class ReaderProvider extends ChangeNotifier {
  // ── State ────────────────────────────────────────────────────────────────────
  BookModel? currentBook;
  DateTime?  _sessionStart;
  int    currentPage        = 0;
  String? currentCfi;
  double percentComplete    = 0;
  int    currentChapter     = 0;
  String currentChapterText = '';
  String readingMode        = 'read';   // 'read' | 'audio'
  String readingLanguage    = 'English';
  bool   isTranslating      = false;
  String? translatedContent;
  double fontSize           = 18;
  double lineHeight         = 1.8;
  String theme              = 'white';  // 'white' | 'sepia' | 'dark'
  String fontFamily         = 'serif';  // 'serif' | 'sans' | 'dyslexic'
  bool   autoSave           = true;
  bool   offlineReading     = false;
  bool   isPlaying          = false;
  bool   showTOC            = false;
  bool   showChatbot        = false;
  double playbackSpeed      = 0.5;
  String? ttsError;

  final _api = ApiService();
  final _tts = TTSService();
  Timer? _saveTimer;
  VoidCallback? _chunkCompletionCallback;

  void setChunkCompletionCallback(VoidCallback cb) {
    _chunkCompletionCallback = cb;
  }

  void clearChunkCompletionCallback() {
    _chunkCompletionCallback = null;
  }

  // ── TTS init ─────────────────────────────────────────────────────────────────
  Future<void> initTts() async {
    await _tts.init();
    _tts.onCompleted = () {
      isPlaying = false;
      notifyListeners();
      _chunkCompletionCallback?.call();
    };
    _tts.onError = (msg) {
      ttsError  = msg;
      isPlaying = false;
      notifyListeners();
    };
  }

  // ── Load/save reading prefs from/to API ──────────────────────────────────────
  Future<void> loadReadingPrefs() async {
    try {
      final response = await _api.get(ApiConstants.authMe);
      final data = response.data as Map<String, dynamic>?;
      final prefs = data?['readingPrefs'] as Map<String, dynamic>?;
      if (prefs == null) return;
      if (prefs['fontSize'] != null)    fontSize      = (prefs['fontSize']    as num).toDouble();
      if (prefs['lineHeight'] != null)  lineHeight     = (prefs['lineHeight']  as num).toDouble();
      if (prefs['theme'] != null)       theme          = prefs['theme']      as String;
      if (prefs['fontFamily'] != null)  fontFamily     = prefs['fontFamily'] as String;
      if (prefs['autoSave'] != null)    autoSave       = prefs['autoSave']   as bool;
      if (prefs['offlineReading'] != null) offlineReading = prefs['offlineReading'] as bool;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> saveReadingPrefs() async {
    try {
      await _api.put(ApiConstants.authMe, data: {
        'readingPrefs': {
          'fontSize':      fontSize,
          'lineHeight':    lineHeight,
          'theme':         theme,
          'fontFamily':    fontFamily,
          'autoSave':      autoSave,
          'offlineReading': offlineReading,
        },
      });
    } catch (_) {}
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(seconds: 2), saveReadingPrefs);
  }

  // ── loadProgress ─────────────────────────────────────────────────────────────
  Future<void> loadProgress(String bookId) async {
    try {
      final response = await _api.get(ApiConstants.progress(bookId));
      final data     = response.data as Map<String, dynamic>?;
      final progress = data?['progress'] as Map<String, dynamic>?;
      if (progress != null) {
        currentPage       = (progress['currentPage']      as num?)?.toInt()    ?? 0;
        currentCfi        =  progress['currentCfi']       as String?;
        percentComplete   = (progress['percentComplete']  as num?)?.toDouble() ?? 0;
        currentChapter    = (progress['currentChapter']   as num?)?.toInt()    ?? 0;
        readingLanguage   =  progress['readingLanguage']  as String? ?? 'English';
        notifyListeners();
      }
      _sessionStart = DateTime.now();
    } catch (_) {
      // Non-fatal — first read has no progress record
    }
  }

  // ── saveProgress ─────────────────────────────────────────────────────────────
  Future<void> saveProgress(String bookId) async {
    final now          = DateTime.now();
    final minutesRead  = _sessionStart != null
        ? now.difference(_sessionStart!).inMinutes
        : 0;
    _sessionStart = now;
    try {
      await _api.put(
        ApiConstants.progress(bookId),
        data: {
          'currentPage':     currentPage,
          'currentCfi':      currentCfi,
          'percentComplete': percentComplete,
          'currentChapter':  currentChapter,
          'readingLanguage': readingLanguage,
          'device':          'mobile',
          if (minutesRead > 0) 'minutesRead': minutesRead,
        },
      );
    } catch (_) {}
  }

  // ── translateCurrentChapter ───────────────────────────────────────────────────
  Future<void> translateCurrentChapter(String targetLanguage) async {
    if (currentChapterText.isEmpty) return;

    isTranslating = true;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiConstants.translate,
        data: {
          'text':           currentChapterText,
          'targetLanguage': targetLanguage,
          'sourceLanguage': 'en',
        },
      );
      final data = response.data as Map<String, dynamic>?;
      translatedContent = data?['translatedText'] as String?;
      readingLanguage   = targetLanguage;
    } catch (_) {
      translatedContent = null;
    } finally {
      isTranslating = false;
      notifyListeners();
    }
  }

  // ── speakCurrentChapter ───────────────────────────────────────────────────────
  Future<void> speakCurrentChapter() async {
    final text     = translatedContent ?? currentChapterText;
    final langCode = _getLangCode(readingLanguage);
    if (text.isEmpty) return;

    ttsError  = null;
    isPlaying = true;
    notifyListeners();

    await _tts.setRate(playbackSpeed);
    await _tts.speak(text, langCode);
    // After awaitSpeakCompletion speak() returns only when TTS finishes/errors;
    // the completion handler above already set isPlaying=false via onCompleted.
  }

  // ── setPlaybackSpeed ──────────────────────────────────────────────────────────
  Future<void> setPlaybackSpeed(double speed) async {
    playbackSpeed = speed.clamp(0.25, 1.0);
    await _tts.setRate(playbackSpeed);
    notifyListeners();
  }

  // ── stopSpeaking ──────────────────────────────────────────────────────────────
  Future<void> stopSpeaking() async {
    await _tts.stop();
    isPlaying = false;
    notifyListeners();
  }

  // ── Display setters ───────────────────────────────────────────────────────────
  void setFontSize(double size) {
    fontSize = size.clamp(12, 30);
    notifyListeners();
    _scheduleSave();
  }

  void setTheme(String t) {
    theme = t;
    notifyListeners();
    _scheduleSave();
  }

  void setFontFamily(String f) {
    fontFamily = f;
    notifyListeners();
    _scheduleSave();
  }

  void setAutoSave(bool v) {
    autoSave = v;
    notifyListeners();
    _scheduleSave();
  }

  void setOfflineReading(bool v) {
    offlineReading = v;
    notifyListeners();
    _scheduleSave();
  }

  void setLineHeight(double lh) {
    lineHeight = lh;
    notifyListeners();
    _scheduleSave();
  }

  void setReadingMode(String mode) {
    readingMode = mode;
    notifyListeners();
  }

  void setCurrentCfi(String cfi) {
    currentCfi = cfi;
    // No notifyListeners — CFI is not directly displayed; batched via setPositionFromEpub.
  }

  void setCurrentChapter(int chapter) {
    if (currentChapter == chapter) return;
    currentChapter = chapter;
    notifyListeners();
  }

  /// Batches all scroll-position state into a single notifyListeners call.
  /// Replaces separate setCurrentCfi + setPage + setCurrentChapter calls in onRelocated.
  void setPositionFromEpub(String cfi, int page, double percent, int chapter) {
    final changed = currentCfi != cfi ||
        currentPage != page ||
        currentChapter != chapter;
    currentCfi      = cfi;
    currentPage     = page;
    percentComplete = percent;
    currentChapter  = chapter;
    if (changed) notifyListeners();
  }

  void setCurrentChapterText(String text) {
    currentChapterText = text;
    translatedContent  = null; // clear stale translation on chapter change
    notifyListeners();
  }

  void setReadingLanguage(String lang) {
    readingLanguage   = lang;
    translatedContent = null;
    notifyListeners();
  }

  void setPage(int page, double percent) {
    currentPage     = page;
    percentComplete = percent;
    notifyListeners();
  }

  void toggleTOC() {
    showTOC = !showTOC;
    showChatbot = false;
    notifyListeners();
  }

  void toggleChatbot() {
    showChatbot = !showChatbot;
    showTOC     = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    _tts.dispose();
    super.dispose();
  }
}
