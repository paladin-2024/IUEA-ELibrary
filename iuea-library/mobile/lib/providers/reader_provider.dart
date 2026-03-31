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
  bool   isPlaying          = false;
  bool   showTOC            = false;
  bool   showChatbot        = false;

  final _api = ApiService();
  final _tts = TTSService();

  // ── TTS init ─────────────────────────────────────────────────────────────────
  Future<void> initTts() async {
    await _tts.init();
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
    } catch (_) {
      // Non-fatal — first read has no progress record
    }
  }

  // ── saveProgress ─────────────────────────────────────────────────────────────
  Future<void> saveProgress(String bookId) async {
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

    await _tts.setRate(1.0);
    await _tts.speak(text, langCode);
    isPlaying = true;
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
  }

  void setTheme(String t) {
    theme = t;
    notifyListeners();
  }

  void setLineHeight(double lh) {
    lineHeight = lh;
    notifyListeners();
  }

  void setReadingMode(String mode) {
    readingMode = mode;
    notifyListeners();
  }

  void setCurrentCfi(String cfi) {
    currentCfi = cfi;
    notifyListeners();
  }

  void setCurrentChapterText(String text) {
    currentChapterText = text;
    translatedContent  = null; // clear stale translation on chapter change
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
    _tts.dispose();
    super.dispose();
  }
}
