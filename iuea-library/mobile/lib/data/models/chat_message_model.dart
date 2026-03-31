class ChatMessageModel {
  final String role;        // 'user' | 'assistant'
  final String content;
  final String language;
  final DateTime? createdAt;

  const ChatMessageModel({
    required this.role,
    required this.content,
    this.language  = 'en',
    this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      role:      json['role']      as String,
      content:   json['content']   as String,
      language:  json['language']  as String? ?? 'en',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }

  bool get isUser      => role == 'user';
  bool get isAssistant => role == 'assistant';
}
