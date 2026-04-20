class ReviewModel {
  final String  id;
  final String  bookId;
  final String? userId;
  final String? userName;
  final String? userAvatar;
  final String? userFaculty;
  final int     rating;
  final String? text;
  final bool    isVerified;
  final int     helpfulCount;
  final bool    votedHelpful;
  final DateTime createdAt;

  const ReviewModel({
    required this.id,
    required this.bookId,
    this.userId,
    this.userName,
    this.userAvatar,
    this.userFaculty,
    required this.rating,
    this.text,
    this.isVerified = false,
    this.helpfulCount = 0,
    this.votedHelpful = false,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> j) {
    final user = j['user'] as Map<String, dynamic>?;
    return ReviewModel(
      id:           j['id'] as String? ?? j['_id'] as String? ?? '',
      bookId:       j['bookId'] as String? ?? '',
      userId:       user?['_id'] as String? ?? user?['id'] as String?,
      userName:     user?['name'] as String?,
      userAvatar:   user?['avatar'] as String?,
      userFaculty:  user?['faculty'] as String?,
      rating:       j['rating'] as int? ?? 1,
      text:         j['text'] as String?,
      isVerified:   j['isVerified'] as bool? ?? false,
      helpfulCount: j['helpfulCount'] as int? ?? 0,
      votedHelpful: j['votedHelpful'] as bool? ?? false,
      createdAt:    j['createdAt'] != null ? DateTime.tryParse(j['createdAt'] as String) ?? DateTime.now() : DateTime.now(),
    );
  }
}
