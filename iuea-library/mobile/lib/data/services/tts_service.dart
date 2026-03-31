import 'package:flutter_tts/flutter_tts.dart';

typedef TTSProgressCallback = void Function(
    String text, int start, int end, String word);

class TTSService {
  final FlutterTts _tts = FlutterTts();
  bool isPlaying = false;

  TTSProgressCallback? onProgress;

  // ── init ────────────────────────────────────────────────────────────────────
  Future<void> init() async {
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(1.0);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
    await _tts.setSharedInstance(true);

    _tts.setStartHandler(() {
      isPlaying = true;
    });

    _tts.setCompletionHandler(() {
      isPlaying = false;
    });

    _tts.setErrorHandler((dynamic msg) {
      isPlaying = false;
    });

    _tts.setProgressHandler((String text, int start, int end, String word) {
      onProgress?.call(text, start, end, word);
    });
  }

  // ── speak ───────────────────────────────────────────────────────────────────
  Future<void> speak(String text, String langCode) async {
    if (text.isEmpty) return;
    await _tts.setLanguage(langCode);
    await _tts.speak(text);
  }

  // ── pause ───────────────────────────────────────────────────────────────────
  Future<void> pause() async {
    await _tts.pause();
    isPlaying = false;
  }

  // ── stop ────────────────────────────────────────────────────────────────────
  Future<void> stop() async {
    await _tts.stop();
    isPlaying = false;
  }

  // ── setRate ─────────────────────────────────────────────────────────────────
  Future<void> setRate(double rate) async {
    await _tts.setSpeechRate(rate.clamp(0.5, 2.0));
  }

  // ── getAvailableVoices ───────────────────────────────────────────────────────
  Future<List<dynamic>> getAvailableVoices() async {
    return await _tts.getVoices as List<dynamic>;
  }

  // ── dispose ─────────────────────────────────────────────────────────────────
  void dispose() {
    _tts.stop();
  }
}
