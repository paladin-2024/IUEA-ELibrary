import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/models/book_model.dart';
import '../../data/repositories/book_repository.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/book_card.dart';

class AuthorScreen extends StatefulWidget {
  final String authorName;
  const AuthorScreen({super.key, required this.authorName});

  @override
  State<AuthorScreen> createState() => _AuthorScreenState();
}

class _AuthorScreenState extends State<AuthorScreen> {
  final _repo = BookRepository(ApiService());

  List<BookModel> _books    = [];
  bool            _loading  = true;
  String?         _error;
  bool            _following = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final books = await _repo.getBooksByAuthor(widget.authorName);
      if (mounted) {
        setState(() { _books = books; _loading = false; });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _loading = false; });
      }
    }
  }

  // ── Derived author stats ────────────────────────────────────────────────────
  String get _categorySubtitle {
    if (_books.isEmpty) return '';
    final freq = <String, int>{};
    for (final b in _books) { freq[b.category] = (freq[b.category] ?? 0) + 1; }
    return (freq.entries.toList()..sort((a, b) => b.value.compareTo(a.value)))
        .first
        .key
        .toUpperCase();
  }

  String? get _quote {
    if (_books.isEmpty) return null;
    final withDesc = _books.where((b) => (b.description ?? '').length > 40).toList();
    if (withDesc.isEmpty) return null;
    withDesc.sort((a, b) => b.rating.compareTo(a.rating));
    final desc = withDesc.first.description!;
    return desc.length > 200 ? '${desc.substring(0, 200)}…' : desc;
  }

  String? get _avatarUrl => _books.isNotEmpty ? _books.first.coverUrl : null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── App Bar ─────────────────────────────────────────────────────────
          SliverAppBar(
            pinned:          true,
            backgroundColor: AppColors.surfaceContainerLow,
            elevation:       0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: () => Navigator.of(context).pop(),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: AppSpacing.md),
                child: FilledButton(
                  onPressed: () => setState(() => _following = !_following),
                  style: FilledButton.styleFrom(
                    backgroundColor: _following
                        ? AppColors.surfaceContainerHighest
                        : AppColors.primary,
                    foregroundColor: _following
                        ? AppColors.textPrimary
                        : AppColors.onPrimary,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.full)),
                    textStyle: AppTextStyles.label.copyWith(
                        fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                  child: Text(_following ? 'Following' : 'Follow'),
                ),
              ),
            ],
          ),

          if (_loading) ...[
            SliverToBoxAdapter(child: _buildHeaderShimmer()),
            SliverPadding(
              padding: const EdgeInsets.all(AppSpacing.md),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (_, __) => _ShimmerCard(),
                  childCount: 6,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount:   2,
                  mainAxisSpacing:  AppSpacing.md,
                  crossAxisSpacing: AppSpacing.md,
                  childAspectRatio: 0.52,
                ),
              ),
            ),
          ] else if (_error != null) ...[
            SliverFillRemaining(
              child: _ErrorState(message: _error!, onRetry: _load),
            ),
          ] else ...[
            // ── Author Header ──────────────────────────────────────────────────
            SliverToBoxAdapter(child: _buildHeader()),

            // ── Books section header ───────────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.md, AppSpacing.lg, AppSpacing.md, AppSpacing.sm),
              sliver: SliverToBoxAdapter(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Books by this author',
                        style: AppTextStyles.h3),
                    Text('${_books.length} total',
                        style: AppTextStyles.label),
                  ],
                ),
              ),
            ),

            // ── Books Grid ────────────────────────────────────────────────────
            _books.isEmpty
                ? SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.menu_book_outlined,
                              size: 48,
                              color: AppColors.primary.withAlpha(77)),
                          const SizedBox(height: 12),
                          Text('No books found for this author',
                              style: AppTextStyles.bodySmall),
                        ],
                      ),
                    ),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(
                        AppSpacing.md, 0, AppSpacing.md, AppSpacing.xxl),
                    sliver: SliverGrid(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => BookCard(book: _books[i]),
                        childCount: _books.length,
                      ),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount:   2,
                        mainAxisSpacing:  AppSpacing.md,
                        crossAxisSpacing: AppSpacing.md,
                        childAspectRatio: 0.52,
                      ),
                    ),
                  ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.md, AppSpacing.lg, AppSpacing.md, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar + stats row
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              // Avatar
              ClipRRect(
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                child: SizedBox(
                  width: 96, height: 96,
                  child: _avatarUrl != null
                      ? CachedNetworkImage(
                          imageUrl:    _avatarUrl!,
                          fit:         BoxFit.cover,
                          errorWidget: (_, __, ___) => _avatarPlaceholder(),
                        )
                      : _avatarPlaceholder(),
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              // Stats
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _StatChip(value: '${_books.length}', label: 'BOOKS'),
                  const SizedBox(height: AppSpacing.sm),
                  const _StatChip(value: '—', label: 'FOLLOWERS'),
                ],
              ),
            ],
          ),

          const SizedBox(height: AppSpacing.md),

          // Name
          Text(
            widget.authorName,
            style: AppTextStyles.h1.copyWith(fontSize: 26),
          ),

          // Category subtitle
          if (_categorySubtitle.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              _categorySubtitle,
              style: AppTextStyles.label.copyWith(
                color:         AppColors.primary,
                fontWeight:    FontWeight.w700,
                letterSpacing: 1.2,
              ),
            ),
          ],

          // Quote
          if (_quote != null) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color:        AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                border: Border.all(
                    color: AppColors.outlineVariant, width: 1),
              ),
              child: Text(
                '"$_quote"',
                style: AppTextStyles.body.copyWith(
                  fontStyle: FontStyle.italic,
                  fontSize:  14,
                  height:    1.6,
                  color:     AppColors.textSecondary,
                ),
                maxLines: 5,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeaderShimmer() {
    return Shimmer.fromColors(
      baseColor:      AppColors.grey300,
      highlightColor: AppColors.grey100,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.md, AppSpacing.lg, AppSpacing.md, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(width: 96, height: 96,
                  decoration: BoxDecoration(
                    color: AppColors.grey300,
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius))),
              const SizedBox(width: AppSpacing.lg),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(width: 60, height: 16, color: AppColors.grey300),
                const SizedBox(height: 10),
                Container(width: 80, height: 16, color: AppColors.grey300),
              ]),
            ]),
            const SizedBox(height: AppSpacing.md),
            Container(width: 200, height: 28, color: AppColors.grey300),
            const SizedBox(height: 8),
            Container(width: 120, height: 14, color: AppColors.grey300),
            const SizedBox(height: AppSpacing.md),
            Container(width: double.infinity, height: 80,
                decoration: BoxDecoration(
                  color: AppColors.grey300,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius))),
          ],
        ),
      ),
    );
  }

  Widget _avatarPlaceholder() => Container(
    color: AppColors.primary.withAlpha(26),
    child: const Center(
      child: Icon(Icons.person_rounded, size: 40, color: AppColors.primary),
    ),
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  final String value;
  final String label;
  const _StatChip({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(value,
          style: AppTextStyles.h2.copyWith(fontSize: 20)),
      Text(label,
          style: AppTextStyles.label.copyWith(
              letterSpacing: 1.0, fontSize: 10)),
    ]);
  }
}

class _ErrorState extends StatelessWidget {
  final String  message;
  final VoidCallback onRetry;
  const _ErrorState({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.cloud_off_rounded,
              size: 48, color: AppColors.primary.withAlpha(102)),
          const SizedBox(height: 12),
          Text('Something went wrong',
              style: AppTextStyles.h3, textAlign: TextAlign.center),
          const SizedBox(height: 6),
          Text(message,
              style: AppTextStyles.bodySmall, textAlign: TextAlign.center,
              maxLines: 3, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Retry'),
            style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary),
          ),
        ]),
      ),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor:      AppColors.grey300,
      highlightColor: AppColors.grey100,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        AspectRatio(
          aspectRatio: 2 / 3,
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.grey300,
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Container(width: double.infinity, height: 12, color: AppColors.grey300),
        const SizedBox(height: 4),
        Container(width: 80, height: 10, color: AppColors.grey300),
      ]),
    );
  }
}
