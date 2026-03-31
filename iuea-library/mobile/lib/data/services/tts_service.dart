import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  final FlutterTts _tts = FlutterTts();
  bool _isPlaying = false;

  bool get isPlaying => _isPlaying;

  Future<void> init() async {
    await _tts.setSharedInstance(true);
    _tts.setCompletionHandler(() => _isPlaying = false);
    _tts.setErrorHandler((msg) { _isPlaying = false; });
  }

  Future<void> speak(
    String text, {
    String language = 'en-US',
    double rate     = 1.0,
    void Function(int wordStart, int wordLength)? onProgress,
  }) async {
    await stop();
    await _tts.setLanguage(language);
    await _tts.setSpeechRate(rate);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);

    if (onProgress != null) {
      _tts.setProgressHandler((String words, int start, int end, String word) {
        onProgress(start, word.length);
      });
    }

    _isPlaying = true;
    await _tts.speak(text);
  }

  Future<void> setRate(double rate) async {
    await _tts.setSpeechRate(rate);
  }

  Future<void> stop() async {
    _isPlaying = false;
    await _tts.stop();
  }

  Future<void> pause() async {
    await _tts.pause();
    _isPlaying = false;
  }

  Future<List<String>> getAvailableLanguages() async {
    final langs = await _tts.getLanguages;
    return List<String>.from(langs as List);
  }

  Future<List<Map<String, String>>> getAvailableVoices() async {
    try {
      final voices = await _tts.getVoices;
      return List<Map<String, String>>.from(
        (voices as List).map((v) => Map<String, String>.from(v as Map)),
      );
    } catch (_) {
      return [];
    }
  }

  void dispose() {
    _tts.stop();
  }
}
