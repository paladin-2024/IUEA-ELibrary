import 'package:flutter/foundation.dart';
import '../data/models/chat_message_model.dart';
import '../data/repositories/chat_repository.dart';

class ChatProvider extends ChangeNotifier {
  final _repo = ChatRepository();

  // sessions keyed by bookId
  final Map<String, List<ChatMessageModel>> sessions = {};
  bool   isLoading        = false;
  bool   isStreaming       = false;
  String streamingMessage  = '';

  List<ChatMessageModel> getMessages(String bookId) =>
      sessions[bookId] ?? [];

  Future<void> loadHistory(String bookId) async {
    try {
      final messages = await _repo.getHistory(bookId);
      sessions[bookId] = messages;
      notifyListeners();
    } catch (_) { /* non-fatal */ }
  }

  Future<void> sendMessage(
    String bookId,
    String message,
    String language, {
    String chapter = '',
  }) async {
    sessions.putIfAbsent(bookId, () => []);
    sessions[bookId]!.add(ChatMessageModel(
      role:      'user',
      content:   message,
      timestamp: DateTime.now(),
      language:  language,
    ));
    isLoading = true;
    notifyListeners();

    try {
      final reply = await _repo.sendMessage(bookId, message, language,
          chapter: chapter);
      sessions[bookId]!.add(ChatMessageModel(
        role:      'assistant',
        content:   reply,
        timestamp: DateTime.now(),
        language:  language,
      ));
    } catch (_) {
      sessions[bookId]!.add(ChatMessageModel(
        role:      'assistant',
        content:   'Sorry, I could not process that. Please try again.',
        timestamp: DateTime.now(),
      ));
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void streamMessage(
    String bookId,
    String message,
    String language, {
    String chapter = '',
  }) {
    sessions.putIfAbsent(bookId, () => []);
    sessions[bookId]!.add(ChatMessageModel(
      role:      'user',
      content:   message,
      timestamp: DateTime.now(),
      language:  language,
    ));
    isStreaming      = true;
    streamingMessage = '';
    notifyListeners();

    _repo.streamMessage(bookId, message, language, chapter: chapter).listen(
      (chunk) {
        streamingMessage += chunk;
        notifyListeners();
      },
      onDone: () {
        sessions[bookId]!.add(ChatMessageModel(
          role:      'assistant',
          content:   streamingMessage,
          timestamp: DateTime.now(),
          language:  language,
        ));
        isStreaming      = false;
        streamingMessage = '';
        notifyListeners();
      },
      onError: (_) {
        sessions[bookId]!.add(ChatMessageModel(
          role:      'assistant',
          content:   'Sorry, an error occurred. Please try again.',
          timestamp: DateTime.now(),
        ));
        isStreaming      = false;
        streamingMessage = '';
        notifyListeners();
      },
    );
  }

  Future<void> clearHistory(String bookId) async {
    try {
      await _repo.clearHistory(bookId);
      sessions[bookId] = [];
      notifyListeners();
    } catch (_) {}
  }
}
