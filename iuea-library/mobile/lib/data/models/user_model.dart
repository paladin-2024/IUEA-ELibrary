class UserModel {
  final String  id;
  final String  name;
  final String  email;
  final String  role;
  final String  language;
  final String  avatar;
  final String  fcmToken;
  final UserPreferences preferences;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.language,
    this.avatar   = '',
    this.fcmToken = '',
    required this.preferences,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id:          json['_id']      as String,
      name:        json['name']     as String,
      email:       json['email']    as String,
      role:        json['role']     as String? ?? 'user',
      language:    json['language'] as String? ?? 'en',
      avatar:      json['avatar']   as String? ?? '',
      fcmToken:    json['fcmToken'] as String? ?? '',
      preferences: UserPreferences.fromJson(
        json['preferences'] as Map<String, dynamic>? ?? {},
      ),
    );
  }

  Map<String, dynamic> toJson() => {
    '_id':      id,
    'name':     name,
    'email':    email,
    'role':     role,
    'language': language,
    'avatar':   avatar,
    'preferences': preferences.toJson(),
  };
}

class UserPreferences {
  final int    fontSize;
  final String theme;
  final double ttsSpeed;
  final bool   notifications;

  const UserPreferences({
    this.fontSize      = 16,
    this.theme         = 'light',
    this.ttsSpeed      = 1.0,
    this.notifications = true,
  });

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      fontSize:      (json['fontSize']     as num?)?.toInt()    ?? 16,
      theme:          json['theme']         as String?           ?? 'light',
      ttsSpeed:      (json['ttsSpeed']     as num?)?.toDouble() ?? 1.0,
      notifications:  json['notifications'] as bool?             ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'fontSize':      fontSize,
    'theme':         theme,
    'ttsSpeed':      ttsSpeed,
    'notifications': notifications,
  };
}
