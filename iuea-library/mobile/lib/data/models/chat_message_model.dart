class ChatMessageModel {
  final String   role;       // 'user' | 'assistant'
  final String   content;
  final DateTime timestamp;
  final String?  language;

  const ChatMessageModel({
    required this.role,
    required this.content,
    required this.timestamp,
    this.language,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      role:    json['role']    as String,
      content: json['content'] as String,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      language: json['language'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'role':      role,
    'content':   content,
    'timestamp': timestamp.toIso8601String(),
    if (language != null) 'language': language,
  };

  bool get isUser      => role == 'user';
  bool get isAssistant => role == 'assistant';
}
