import '../models/chat_message_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class ChatRepository {
  final ApiService _api;
  ChatRepository(this._api);

  Future<String> sendMessage(String bookId, String message, {String language = 'en'}) async {
    final data = await _api.post(
      ApiConstants.chat(bookId),
      body: {'message': message, 'language': language},
    );
    return data['reply'] as String;
  }

  Future<List<ChatMessageModel>> getHistory(String bookId) async {
    final data = await _api.get(ApiConstants.chatHistory(bookId));
    return (data['messages'] as List<dynamic>)
        .map((m) => ChatMessageModel.fromJson(m as Map<String, dynamic>))
        .toList();
  }
}
