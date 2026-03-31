import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../providers/book_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/book_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchCtrl = TextEditingController();
  Timer?  _debounce;
  bool    _hasSearched = false;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      final q = value.trim();
      if (q.isEmpty) {
        context.read<BookProvider>().clearSearch();
        setState(() => _hasSearched = false);
        return;
      }
      setState(() => _hasSearched = true);
      context.read<BookProvider>().searchBooks(q);
    });
  }

  void _submitSearch() {
    final q = _searchCtrl.text.trim();
    if (q.isEmpty) return;
    _debounce?.cancel();
    setState(() => _hasSearched = true);
    context.read<BookProvider>().searchBooks(q);
  }

  @override
  Widget build(BuildContext context) {
    final bp = context.watch<BookProvider>();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        titleSpacing:    0,
        title: TextField(
          controller:  _searchCtrl,
          autofocus:   true,
          style:       const TextStyle(color: AppColors.white),
          cursorColor: AppColors.accent,
          textInputAction: TextInputAction.search,
          onChanged:   _onChanged,
          onSubmitted: (_) => _submitSearch(),
          decoration: InputDecoration(
            hintText:  'Search books, authors, topics…',
            hintStyle: TextStyle(color: AppColors.white.withOpacity(0.5)),
            border:    InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 4),
          ),
        ),
        actions: [
          if (_searchCtrl.text.isNotEmpty)
            IconButton(
              icon:      const Icon(Icons.close, color: AppColors.white),
              onPressed: () {
                _searchCtrl.clear();
                context.read<BookProvider>().clearSearch();
                setState(() => _hasSearched = false);
              },
            ),
          IconButton(
            icon:      const Icon(Icons.search, color: AppColors.white),
            onPressed: _submitSearch,
          ),
        ],
      ),
      body: bp.searchLoading
          ? _ShimmerGrid()
          : !_hasSearched
              ? _emptyPrompt()
              : bp.searchResults.isEmpty && bp.externalResults.isEmpty
                  ? _noResults()
                  : _ResultsList(
                      internal: bp.searchResults,
                      external: bp.externalResults,
                      query:    _searchCtrl.text,
                    ),
    );
  }

  Widget _emptyPrompt() => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.search, size: 64, color: AppColors.grey300),
        const SizedBox(height: 12),
        Text('Search for books, authors or topics',
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey500)),
      ],
    ),
  );

  Widget _noResults() => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.search_off, size: 64, color: AppColors.grey300),
        const SizedBox(height: 12),
        Text('No results for "${_searchCtrl.text}"',
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey500)),
        const SizedBox(height: 4),
        Text('Try different keywords',
          style: AppTextStyles.label.copyWith(color: AppColors.textHint)),
      ],
    ),
  );
}

// ── Results list ───────────────────────────────────────────────────────────────
class _ResultsList extends StatelessWidget {
  final List    internal;
  final List    external;
  final String  query;

  const _ResultsList({
    required this.internal,
    required this.external,
    required this.query,
  });

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        if (internal.isNotEmpty) ...[
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.pagePadding, AppSpacing.md,
              AppSpacing.pagePadding, AppSpacing.sm),
            sliver: SliverToBoxAdapter(
              child: Text(
                '${internal.length} result${internal.length != 1 ? 's' : ''} from IUEA catalogue',
                style: AppTextStyles.label),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.pagePadding),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate(
                (_, i) => BookCard(book: internal[i], width: double.infinity),
                childCount: internal.length,
              ),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount:   2,
                crossAxisSpacing: AppSpacing.sm,
                mainAxisSpacing:  AppSpacing.sm,
                childAspectRatio: 0.65,
              ),
            ),
          ),
        ],

        // Divider before external results
        if (external.isNotEmpty) ...[
          SliverPadding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.pagePadding,
              vertical:   AppSpacing.lg),
            sliver: SliverToBoxAdapter(
              child: Row(children: [
                const Expanded(child: Divider()),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm),
                  child: Text('Internet Archive & Project Gutenberg',
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.textHint)),
                ),
                const Expanded(child: Divider()),
              ]),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.pagePadding),
            sliver: SliverGrid(
              delegate: SliverChildBuilderDelegate(
                (_, i) => BookCard(book: external[i], width: double.infinity),
                childCount: external.length,
              ),
              gridDelegate:
                  const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount:   2,
                crossAxisSpacing: AppSpacing.sm,
                mainAxisSpacing:  AppSpacing.sm,
                childAspectRatio: 0.65,
              ),
            ),
          ),
          const SliverPadding(
            padding: EdgeInsets.only(bottom: AppSpacing.xl)),
        ],
      ],
    );
  }
}

// ── Shimmer grid ───────────────────────────────────────────────────────────────
class _ShimmerGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor:      AppColors.grey300,
      highlightColor: AppColors.grey100,
      child: GridView.builder(
        padding:      const EdgeInsets.all(AppSpacing.pagePadding),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount:   2,
          crossAxisSpacing: AppSpacing.sm,
          mainAxisSpacing:  AppSpacing.sm,
          childAspectRatio: 0.65,
        ),
        itemCount:   8,
        itemBuilder: (_, __) => Container(
          decoration: BoxDecoration(
            color:        AppColors.grey300,
            borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
          ),
        ),
      ),
    );
  }
}
