import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/chat_message_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class ChatRepository {
  final _api     = ApiService();
  final _storage = const FlutterSecureStorage();

  Future<String> sendMessage(
    String bookId,
    String message,
    String language, {
    String chapter = '',
  }) async {
    final response = await _api.post(
      ApiConstants.chat(bookId),
      data: {
        'message':  message,
        'language': language,
        'chapter':  chapter,
      },
    );
    return response.data['reply'] as String;
  }

  Future<List<ChatMessageModel>> getHistory(String bookId) async {
    final response = await _api.get(ApiConstants.chatHistory(bookId));
    final msgs     = (response.data['messages'] as List?) ?? [];
    return msgs
        .map((m) => ChatMessageModel.fromJson(m as Map<String, dynamic>))
        .toList();
  }

  Future<void> clearHistory(String bookId) async {
    await _api.delete(ApiConstants.chat(bookId));
  }

  // SSE streaming — uses a dedicated Dio instance for ResponseType.stream
  Stream<String> streamMessage(
    String bookId,
    String message,
    String language, {
    String chapter = '',
  }) {
    final controller = StreamController<String>();

    () async {
      try {
        final token = await _storage.read(key: 'jwt_token');
        final dio   = Dio();

        final response = await dio.get<ResponseBody>(
          ApiConstants.chatStream(bookId),
          queryParameters: {
            'message':  message,
            'language': language,
            'chapter':  chapter,
          },
          options: Options(
            responseType: ResponseType.stream,
            headers: {
              'Authorization': 'Bearer $token',
              'Accept':        'text/event-stream',
            },
          ),
        );

        String buf = '';

        await for (final Uint8List bytes in response.data!.stream) {
          buf += utf8.decode(bytes);
          final lines = buf.split('\n');
          buf = lines.removeLast(); // keep incomplete line

          for (final line in lines) {
            if (!line.startsWith('data: ')) continue;
            final raw = line.substring(6).trim();

            if (raw == '[DONE]') {
              await controller.close();
              return;
            }

            try {
              final decoded = json.decode(raw) as Map<String, dynamic>;
              final chunk   = decoded['chunk'] as String?;
              if (chunk != null && chunk.isNotEmpty) {
                controller.add(chunk);
              }
            } catch (_) { /* ignore malformed line */ }
          }
        }

        await controller.close();
      } catch (e) {
        controller.addError(e);
        await controller.close();
      }
    }();

    return controller.stream;
  }
}
