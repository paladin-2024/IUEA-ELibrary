class BorrowRequestModel {
  final String  id;
  final String  bookId;
  final String  bookTitle;
  final String? bookAuthor;
  final String? bookCoverUrl;
  final String? shelfLocation;
  final String  status;
  final DateTime? approvedAt;
  final DateTime? dueDate;
  final DateTime? returnedAt;
  final String? adminNotes;
  final bool    renewalRequested;
  final int     renewalCount;
  final DateTime createdAt;

  const BorrowRequestModel({
    required this.id,
    required this.bookId,
    required this.bookTitle,
    this.bookAuthor,
    this.bookCoverUrl,
    this.shelfLocation,
    required this.status,
    this.approvedAt,
    this.dueDate,
    this.returnedAt,
    this.adminNotes,
    this.renewalRequested = false,
    this.renewalCount = 0,
    required this.createdAt,
  });

  factory BorrowRequestModel.fromJson(Map<String, dynamic> j) =>
    BorrowRequestModel(
      id:               j['_id'] as String? ?? j['id'] as String? ?? '',
      bookId:           j['bookId'] as String? ?? '',
      bookTitle:        j['bookTitle'] as String? ?? '',
      bookAuthor:       j['bookAuthor'] as String?,
      bookCoverUrl:     j['bookCoverUrl'] as String?,
      shelfLocation:    j['shelfLocation'] as String?,
      status:           j['status'] as String? ?? 'pending',
      approvedAt:       j['approvedAt'] != null ? DateTime.tryParse(j['approvedAt'] as String) : null,
      dueDate:          j['dueDate']    != null ? DateTime.tryParse(j['dueDate']    as String) : null,
      returnedAt:       j['returnedAt'] != null ? DateTime.tryParse(j['returnedAt'] as String) : null,
      adminNotes:       j['adminNotes'] as String?,
      renewalRequested: j['renewalRequested'] as bool? ?? false,
      renewalCount:     j['renewalCount'] as int? ?? 0,
      createdAt:        j['createdAt'] != null ? DateTime.tryParse(j['createdAt'] as String) ?? DateTime.now() : DateTime.now(),
    );

  int? get daysUntilDue {
    if (dueDate == null) return null;
    return dueDate!.difference(DateTime.now()).inDays;
  }

  bool get isOverdue => dueDate != null && DateTime.now().isAfter(dueDate!);
}
