import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/repositories/progress_repository.dart';
import '../../data/models/progress_model.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/loading_widget.dart';

const _tabs = ['All', 'Reading', 'Finished'];

class MyLibraryScreen extends StatefulWidget {
  const MyLibraryScreen({super.key});

  @override
  State<MyLibraryScreen> createState() => _MyLibraryScreenState();
}

class _MyLibraryScreenState extends State<MyLibraryScreen> {
  final _repo         = ProgressRepository(ApiService());
  List<ProgressModel> _all       = [];
  bool                _isLoading = true;
  int                 _tab       = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _repo.getAllProgress();
      if (mounted) setState(() { _all = data; _isLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<ProgressModel> get _filtered {
    switch (_tab) {
      case 1: return _all.where((p) => p.percentComplete > 0 && !p.isCompleted).toList();
      case 2: return _all.where((p) => p.isCompleted).toList();
      default: return _all;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // ── Header ─────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
            child: Row(children: [
              Text('My Library',
                style: AppTextStyles.h2.copyWith(
                  fontSize: 22, color: AppColors.textPrimary)),
              const Spacer(),
              TextButton.icon(
                onPressed: () => context.push('/library/loans'),
                icon: const Icon(Icons.local_library_outlined, size: 16),
                label: const Text('My Loans'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  textStyle: AppTextStyles.label.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 14),

          // ── Tab pills ───────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(_tabs.length, (i) {
                final active = i == _tab;
                return Padding(
                  padding: EdgeInsets.only(right: i < _tabs.length - 1 ? 8 : 0),
                  child: GestureDetector(
                    onTap: () => setState(() => _tab = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 8),
                      decoration: BoxDecoration(
                        color:        active ? AppColors.primary : AppColors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: active ? AppColors.primary : AppColors.border),
                      ),
                      child: Text(
                        _tabs[i],
                        style: AppTextStyles.label.copyWith(
                          color:      active ? AppColors.white : AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize:   12,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 16),

          // ── Content ─────────────────────────────────────────────────────
          Expanded(
            child: _isLoading
              ? const LoadingWidget()
              : RefreshIndicator(
                  color:     AppColors.primary,
                  onRefresh: _load,
                  child: _filtered.isEmpty
                    ? _emptyState()
                    : ListView.separated(
                        padding:          const EdgeInsets.symmetric(horizontal: 20),
                        itemCount:        _filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder:      (_, i) => _BookRow(
                          progress: _filtered[i],
                          onTap: () {
                            final b = _filtered[i].book;
                            if (b != null) context.push('/reader/${b.id}');
                          },
                        ),
                      ),
                ),
          ),

          // ── Footer ─────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(children: [
              Text('POWERED BY GOOGLE',
                style: TextStyle(
                  fontFamily: 'Inter', fontSize: 9, letterSpacing: 1.4,
                  color: AppColors.textHint.withOpacity(0.6))),
              const SizedBox(height: 3),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                _fl('Privacy'), _fd(), _fl('Terms'),
                _fd(), _fl('Translate'), _fd(), _fl('Books API'),
              ]),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _emptyState() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.book_outlined, size: 56, color: AppColors.grey300),
      const SizedBox(height: 10),
      Text(
        _tab == 1 ? 'No books in progress.' :
        _tab == 2 ? 'No finished books yet.' : 'Your library is empty.',
        style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey500)),
    ]),
  );

  Widget _fl(String t) => Text(t, style: TextStyle(
    fontFamily: 'Inter', fontSize: 10,
    color: AppColors.textHint.withOpacity(0.6),
    decoration: TextDecoration.underline,
    decorationColor: AppColors.textHint.withOpacity(0.3)));
  Widget _fd() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Text('·', style: TextStyle(
      fontSize: 10, color: AppColors.textHint.withOpacity(0.5))));
}

// ── Book row ──────────────────────────────────────────────────────────────────
class _BookRow extends StatelessWidget {
  final ProgressModel progress;
  final VoidCallback  onTap;
  const _BookRow({required this.progress, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final book = progress.book;
    final pct  = (progress.percentComplete / 100).clamp(0.0, 1.0);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color:        AppColors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(
            color: Colors.black.withOpacity(0.04), blurRadius: 8,
            offset: const Offset(0, 2))],
        ),
        child: Row(children: [
          // Cover
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 52, height: 72,
              child: (book?.coverUrl?.isNotEmpty ?? false)
                ? CachedNetworkImage(
                    imageUrl: book!.coverUrl!, fit: BoxFit.cover)
                : Container(
                    color: AppColors.primary.withOpacity(0.08),
                    child: const Icon(Icons.book_outlined,
                      color: AppColors.primary, size: 24)),
            ),
          ),
          const SizedBox(width: 14),

          // Info
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(book?.title ?? 'Unknown',
                style: AppTextStyles.body.copyWith(
                  fontWeight: FontWeight.w600, fontSize: 14),
                maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(book?.authorDisplay ?? '',
                style: AppTextStyles.bodySmall.copyWith(
                  fontSize: 12, color: AppColors.textSecondary),
                maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value:           pct,
                backgroundColor: AppColors.grey300,
                valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                minHeight:    4,
                borderRadius: BorderRadius.circular(2),
              ),
              const SizedBox(height: 5),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    progress.isCompleted
                      ? 'Finished'
                      : '${progress.percentInt}% COMPLETE',
                    style: AppTextStyles.label.copyWith(
                      fontSize:   10,
                      color:      progress.isCompleted
                          ? AppColors.success : AppColors.textHint,
                      fontWeight: FontWeight.w600,
                    )),
                  if (book?.pageCount != null)
                    Text(
                      '${progress.currentPage} · ${book!.pageCount} pages',
                      style: AppTextStyles.label.copyWith(
                        fontSize: 10, color: AppColors.textHint)),
                  if (progress.isCompleted)
                    Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.check_circle_rounded,
                        color: AppColors.success, size: 12),
                      const SizedBox(width: 3),
                      Text('Finished 3 days ago',
                        style: AppTextStyles.label.copyWith(
                          fontSize: 10, color: AppColors.success)),
                    ]),
                ],
              ),
            ],
          )),
        ]),
      ),
    );
  }
}
