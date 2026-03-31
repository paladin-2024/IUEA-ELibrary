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

  Future<void> speak(String text, {String language = 'en-US', double rate = 1.0}) async {
    await stop();
    await _tts.setLanguage(language);
    await _tts.setSpeechRate(rate);
    await _tts.setVolume(1.0);
    await _tts.setPitch(1.0);
    _isPlaying = true;
    await _tts.speak(text);
  }

  Future<void> stop() async {
    _isPlaying = false;
    await _tts.stop();
  }

  Future<void> pause() async {
    await _tts.pause();
    _isPlaying = false;
  }

  Future<List<dynamic>> getAvailableLanguages() async {
    return await _tts.getLanguages as List<dynamic>;
  }

  void dispose() {
    _tts.stop();
  }
}
