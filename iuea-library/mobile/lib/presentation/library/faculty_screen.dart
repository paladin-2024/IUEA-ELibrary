import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/models/book_model.dart';
import '../../data/repositories/book_repository.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/book_card.dart';

enum _SortOption { recent, popular, titleAZ }

class FacultyScreen extends StatefulWidget {
  final String facultyName;
  const FacultyScreen({super.key, required this.facultyName});

  @override
  State<FacultyScreen> createState() => _FacultyScreenState();
}

class _FacultyScreenState extends State<FacultyScreen> {
  final _repo = BookRepository(ApiService());

  List<BookModel> _books      = [];
  bool            _loading    = true;
  String?         _error;
  bool            _isGrid     = true;
  _SortOption     _sort       = _SortOption.recent;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final books = await _repo.getBooksByFaculty(widget.facultyName);
      if (mounted) setState(() { _books = books; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<BookModel> get _sorted {
    final list = List<BookModel>.from(_books);
    switch (_sort) {
      case _SortOption.recent:
        list.sort((a, b) =>
            (b.publishedYear ?? 0).compareTo(a.publishedYear ?? 0));
      case _SortOption.popular:
        list.sort((a, b) => b.rating.compareTo(a.rating));
      case _SortOption.titleAZ:
        list.sort((a, b) => a.title.compareTo(b.title));
    }
    return list;
  }

  String get _sortLabel {
    switch (_sort) {
      case _SortOption.recent:  return 'Recent';
      case _SortOption.popular: return 'Popular';
      case _SortOption.titleAZ: return 'Title A–Z';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceContainerLow,
        elevation:       0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Faculty of ${widget.facultyName}',
          style: AppTextStyles.h3,
        ),
      ),
      body: _loading
          ? _buildShimmer()
          : _error != null
              ? _ErrorState(message: _error!, onRetry: _load)
              : Column(
                  children: [
                    _buildSubheader(),
                    Expanded(child: _buildContent()),
                  ],
                ),
    );
  }

  Widget _buildSubheader() {
    return Container(
      color: AppColors.surfaceContainerLow,
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.md, 0, AppSpacing.sm, AppSpacing.sm),
      child: Row(
        children: [
          Text(
            '${_books.length} PUBLICATIONS',
            style: AppTextStyles.label.copyWith(
              letterSpacing: 1.0,
              fontSize:      11,
              color:         AppColors.textSecondary,
            ),
          ),
          const Spacer(),
          // Sort dropdown
          PopupMenuButton<_SortOption>(
            initialValue: _sort,
            onSelected:   (v) => setState(() => _sort = v),
            itemBuilder:  (_) => [
              const PopupMenuItem(
                  value: _SortOption.recent,
                  child: Text('Recent')),
              const PopupMenuItem(
                  value: _SortOption.popular,
                  child: Text('Popular')),
              const PopupMenuItem(
                  value: _SortOption.titleAZ,
                  child: Text('Title A–Z')),
            ],
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(_sortLabel,
                  style: AppTextStyles.label.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600)),
              const SizedBox(width: 2),
              const Icon(Icons.keyboard_arrow_down_rounded,
                  size: 18, color: AppColors.primary),
            ]),
          ),
          const SizedBox(width: 4),
          // Grid/List toggle
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: Icon(
              _isGrid
                  ? Icons.grid_view_rounded
                  : Icons.view_list_rounded,
              color: AppColors.primary,
              size:  20,
            ),
            onPressed: () => setState(() => _isGrid = !_isGrid),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final books = _sorted;

    if (books.isEmpty) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.library_books_outlined,
              size: 48, color: AppColors.primary.withAlpha(77)),
          const SizedBox(height: 12),
          Text('No books found in ${widget.facultyName}',
              style: AppTextStyles.bodySmall),
        ]),
      );
    }

    if (_isGrid) {
      return LayoutBuilder(
        builder: (context, constraints) {
          const cols  = 2;
          const pad   = AppSpacing.md;   // 16 left + 16 right
          const gap   = AppSpacing.md;   // gap between columns
          final cellW = (constraints.maxWidth - pad * 2 - gap * (cols - 1)) / cols;
          final coverH = (cellW * 1.5).clamp(0.0, 210.0);
          // title (2 lines ≈ 28px) + gap (6px) + author (16px) + badge row (26px)
          final cellH = coverH + 76.0;
          return RefreshIndicator(
            onRefresh: _load,
            color:     AppColors.primary,
            child: GridView.builder(
              padding: const EdgeInsets.all(pad),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount:   cols,
                mainAxisSpacing:  gap,
                crossAxisSpacing: gap,
                childAspectRatio: cellW / cellH,
              ),
              itemCount:   books.length,
              itemBuilder: (_, i) => BookCard(book: books[i], width: cellW),
            ),
          );
        },
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color:     AppColors.primary,
      child: ListView.separated(
        padding:         const EdgeInsets.all(AppSpacing.md),
        itemCount:       books.length,
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
        itemBuilder: (_, i) => _ListBookRow(book: books[i]),
      ),
    );
  }

  Widget _buildShimmer() {
    return LayoutBuilder(
      builder: (context, constraints) {
        const cols  = 2;
        const pad   = AppSpacing.md;
        const gap   = AppSpacing.md;
        final cellW = (constraints.maxWidth - pad * 2 - gap * (cols - 1)) / cols;
        final coverH = (cellW * 1.5).clamp(0.0, 210.0);
        final cellH  = coverH + 76.0;
        return Shimmer.fromColors(
          baseColor:      AppColors.grey300,
          highlightColor: AppColors.grey100,
          child: GridView.builder(
            padding: const EdgeInsets.all(pad),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:   cols,
              mainAxisSpacing:  gap,
              crossAxisSpacing: gap,
              childAspectRatio: cellW / cellH,
            ),
            itemCount:   6,
            itemBuilder: (_, __) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height:      coverH,
                  decoration: BoxDecoration(
                    color:        AppColors.grey300,
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                  ),
                ),
                const SizedBox(height: 6),
                Container(width: double.infinity, height: 12, color: AppColors.grey300),
                const SizedBox(height: 4),
                Container(width: 80, height: 10, color: AppColors.grey300),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ── List row variant ──────────────────────────────────────────────────────────

class _ListBookRow extends StatelessWidget {
  final BookModel book;
  const _ListBookRow({required this.book});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context)
          .pushNamed('/books/${book.id}'),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color:        AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        ),
        child: Row(children: [
          // Cover
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.sm),
            child: SizedBox(
              width: 56, height: 80,
              child: book.hasCover
                  ? Image.network(book.coverUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _placeholder())
                  : _placeholder(),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(book.title,
                    style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.w600, fontSize: 14),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(book.author,
                    style: AppTextStyles.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
                if (book.publishedYear != null) ...[
                  const SizedBox(height: 4),
                  Text('${book.category} · ${book.publishedYear}',
                      style: AppTextStyles.label.copyWith(fontSize: 11)),
                ],
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded,
              color: AppColors.outline, size: 20),
        ]),
      ),
    );
  }

  Widget _placeholder() => Container(
    color: AppColors.primary.withAlpha(20),
    child: const Center(
        child: Icon(Icons.book_outlined,
            color: AppColors.primary, size: 24)),
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

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
            icon:  const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Retry'),
            style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary),
          ),
        ]),
      ),
    );
  }
}
