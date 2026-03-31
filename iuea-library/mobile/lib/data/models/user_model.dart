class UserModel {
  final String       id;
  final String       name;
  final String       email;
  final String?      studentId;
  final String?      faculty;
  final String       role;                   // student | staff | admin
  final List<String> preferredLanguages;
  final String?      avatar;                 // R2 URL
  final String?      kohaPatronId;
  final int          readingGoal;
  final bool         isActive;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.studentId,
    this.faculty,
    this.role                = 'student',
    this.preferredLanguages  = const ['English'],
    this.avatar,
    this.kohaPatronId,
    this.readingGoal         = 20,
    this.isActive            = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id:   json['_id']   as String? ?? json['id'] as String,
      name:  json['name']  as String,
      email: json['email'] as String,
      studentId: json['studentId'] as String?,
      faculty:   json['faculty']   as String?,
      role: json['role'] as String? ?? 'student',
      preferredLanguages: (json['preferredLanguages'] as List<dynamic>?)
              ?.cast<String>() ??
          ['English'],
      avatar:       json['avatar']       as String?,
      kohaPatronId: json['kohaPatronId'] as String?,
      readingGoal:  (json['readingGoal'] as num?)?.toInt() ?? 20,
      isActive:      json['isActive']    as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    '_id':               id,
    'name':              name,
    'email':             email,
    if (studentId != null)    'studentId':    studentId,
    if (faculty   != null)    'faculty':      faculty,
    'role':              role,
    'preferredLanguages': preferredLanguages,
    if (avatar       != null) 'avatar':       avatar,
    if (kohaPatronId != null) 'kohaPatronId': kohaPatronId,
    'readingGoal':       readingGoal,
    'isActive':          isActive,
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  bool get isAdmin => role == 'admin';
  bool get isStaff => role == 'staff' || role == 'admin';

  /// First letter of name, uppercased — for avatar placeholder
  String get initials => name.isNotEmpty ? name[0].toUpperCase() : '?';
}
