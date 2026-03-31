import 'package:flutter/foundation.dart';
import '../data/models/chat_message_model.dart';
import '../data/repositories/chat_repository.dart';
import '../data/services/api_service.dart';

class ChatProvider extends ChangeNotifier {
  final Map<String, List<ChatMessageModel>> _sessions = {};
  bool    _isSending = false;
  String? _error;

  bool    get isSending => _isSending;
  String? get error     => _error;

  final ChatRepository _repo = ChatRepository(ApiService());

  List<ChatMessageModel> getMessages(String bookId) =>
      _sessions[bookId] ?? [];

  Future<void> loadHistory(String bookId) async {
    try {
      final messages = await _repo.getHistory(bookId);
      _sessions[bookId] = messages;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> sendMessage(String bookId, String message, {String language = 'en'}) async {
    _isSending = true;
    _error     = null;

    // Optimistically add user message
    _sessions.putIfAbsent(bookId, () => []);
    _sessions[bookId]!.add(ChatMessageModel(role: 'user', content: message, language: language));
    notifyListeners();

    try {
      final reply = await _repo.sendMessage(bookId, message, language: language);
      _sessions[bookId]!.add(ChatMessageModel(role: 'assistant', content: reply, language: language));
    } catch (e) {
      _error = e.toString();
      _sessions[bookId]!.add(const ChatMessageModel(
        role:    'assistant',
        content: 'Sorry, I could not process that. Please try again.',
      ));
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  void clearSession(String bookId) {
    _sessions.remove(bookId);
    notifyListeners();
  }
}
