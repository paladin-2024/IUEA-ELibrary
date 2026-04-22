import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/models/borrow_request_model.dart';
import '../../data/repositories/borrowing_repository.dart';
import '../../data/services/api_service.dart';

class MyLoansScreen extends StatefulWidget {
  const MyLoansScreen({super.key});

  @override
  State<MyLoansScreen> createState() => _MyLoansScreenState();
}

class _MyLoansScreenState extends State<MyLoansScreen> {
  final _repo = BorrowingRepository(ApiService());

  List<BorrowRequestModel> _loans   = [];
  bool _loading  = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final loans = await _repo.getMyLoans();
      if (mounted) setState(() { _loans = loans; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancel(String id) async {
    try {
      await _repo.cancelRequest(id);
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Request cancelled.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not cancel.')));
      }
    }
  }

  Future<void> _renew(String id) async {
    try {
      await _repo.requestRenewal(id);
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Renewal requested.')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())));
      }
    }
  }

  List<BorrowRequestModel> get _filtered =>
    _filter == 'all' ? _loans : _loans.where((l) => l.status == _filter).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation:       0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text('My Loans', style: AppTextStyles.h2.copyWith(fontSize: 18)),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : RefreshIndicator(
            color:     AppColors.primary,
            onRefresh: _load,
            child: Column(
              children: [
                // Filter chips
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    children: ['all', 'pending', 'active', 'overdue', 'returned'].map((f) {
                      final active = _filter == f;
                      return GestureDetector(
                        onTap: () => setState(() => _filter = f),
                        child: Container(
                          margin:  const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color:        active ? AppColors.primary : AppColors.grey100,
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            f[0].toUpperCase() + f.substring(1),
                            style: AppTextStyles.label.copyWith(
                              color: active ? AppColors.white : AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),

                Expanded(
                  child: _filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('📚', style: TextStyle(fontSize: 48)),
                            const SizedBox(height: 12),
                            Text('No loans found',
                              style: AppTextStyles.body.copyWith(color: AppColors.textSecondary)),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () => context.go('/search'),
                              child: const Text('Browse Books'),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        itemCount: _filtered.length,
                        itemBuilder: (_, i) => _LoanCard(
                          loan:     _filtered[i],
                          onCancel: _cancel,
                          onRenew:  _renew,
                          onView:   (id) => context.push('/books/$id'),
                        ),
                      ),
                ),
              ],
            ),
          ),
    );
  }
}

class _LoanCard extends StatelessWidget {
  final BorrowRequestModel loan;
  final void Function(String) onCancel;
  final void Function(String) onRenew;
  final void Function(String) onView;

  const _LoanCard({
    required this.loan,
    required this.onCancel,
    required this.onRenew,
    required this.onView,
  });

  Color get _statusColor {
    switch (loan.status) {
      case 'pending':  return Colors.orange;
      case 'approved': return Colors.green;
      case 'active':   return Colors.blue;
      case 'overdue':  return Colors.red;
      case 'returned': return Colors.grey;
      case 'rejected': return Colors.red;
      default:         return Colors.grey;
    }
  }

  String get _statusLabel {
    switch (loan.status) {
      case 'pending':  return 'Pending';
      case 'approved': return 'Ready for Pickup';
      case 'active':   return 'Active';
      case 'overdue':  return 'Overdue';
      case 'returned': return 'Returned';
      case 'rejected': return 'Rejected';
      default:         return loan.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final days = loan.daysUntilDue;

    return Container(
      margin:  const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0,2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: loan.bookCoverUrl != null
              ? Image.network(loan.bookCoverUrl!, width: 48, height: 68, fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _placeholder())
              : _placeholder(),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title + status
                Row(children: [
                  Expanded(
                    child: Text(loan.bookTitle,
                      style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.w700, fontSize: 14),
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color:        _statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(_statusLabel,
                      style: AppTextStyles.label.copyWith(
                        color: _statusColor, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ]),

                if (loan.bookAuthor != null) ...[
                  const SizedBox(height: 2),
                  Text(loan.bookAuthor!,
                    style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
                ],

                if (loan.status == 'approved' && loan.shelfLocation != null) ...[
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.location_on_outlined, size: 12, color: Colors.green),
                    const SizedBox(width: 4),
                    Text(loan.shelfLocation!,
                      style: AppTextStyles.label.copyWith(color: Colors.green, fontSize: 12)),
                  ]),
                ],

                if (loan.dueDate != null && ['active','overdue'].contains(loan.status)) ...[
                  const SizedBox(height: 4),
                  Text(
                    days != null && days < 0
                      ? 'Overdue by ${days.abs()} day${days.abs() != 1 ? "s" : ""}'
                      : days == 0
                        ? 'Due today!'
                        : 'Due in $days day${days != 1 ? "s" : ""}',
                    style: AppTextStyles.label.copyWith(
                      color: loan.isOverdue || (days != null && days <= 2) ? Colors.red : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],

                if (loan.adminNotes != null) ...[
                  const SizedBox(height: 4),
                  Text('"${loan.adminNotes}"',
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.textHint, fontStyle: FontStyle.italic, fontSize: 12)),
                ],

                const SizedBox(height: 10),

                // Action buttons
                Row(children: [
                  if (loan.status == 'pending')
                    _ActionChip(
                      label: 'Cancel',
                      color: Colors.red,
                      onTap:  () => onCancel(loan.id),
                    ),
                  if (['active', 'overdue'].contains(loan.status) &&
                      !loan.renewalRequested && loan.renewalCount < 2) ...[
                    _ActionChip(
                      label: 'Renew',
                      color: AppColors.primary,
                      onTap:  () => onRenew(loan.id),
                    ),
                    const SizedBox(width: 8),
                  ],
                  _ActionChip(
                    label: 'View Book',
                    color: AppColors.primary,
                    outlined: true,
                    onTap:  () => onView(loan.bookId),
                  ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _placeholder() => Container(
    width: 48, height: 68,
    color: AppColors.grey100,
    child: const Icon(Icons.book_outlined, color: AppColors.grey300, size: 24),
  );
}

class _ActionChip extends StatelessWidget {
  final String  label;
  final Color   color;
  final bool    outlined;
  final VoidCallback onTap;

  const _ActionChip({
    required this.label,
    required this.color,
    required this.onTap,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color:        outlined ? Colors.transparent : color.withValues(alpha: 0.1),
        border:       Border.all(color: color.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label,
        style: AppTextStyles.label.copyWith(
          color: color, fontWeight: FontWeight.w700, fontSize: 12)),
    ),
  );
}
