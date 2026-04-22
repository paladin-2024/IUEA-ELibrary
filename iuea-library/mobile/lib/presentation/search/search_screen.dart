import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../providers/book_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/app_error_state.dart';
import '../widgets/book_card.dart';

const _categories = [
  'All', 'Law', 'Medicine', 'Engineering', 'Business',
  'IT', 'Education', 'Arts', 'Science',
];
const _languages = ['All', 'English', 'French', 'Arabic', 'Swahili', 'Luganda'];

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchCtrl  = TextEditingController();
  Timer?  _debounce;
  bool    _hasSearched = false;
  String? _activeCategory;
  String? _activeLanguage;

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

  void _clearFilter(String type) {
    setState(() {
      if (type == 'category') _activeCategory = null;
      if (type == 'language') _activeLanguage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bp   = context.watch<BookProvider>();
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Top bar ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 16, 0),
              child: Row(
                children: [
                  Text(
                    'IUEA Library',
                    style: TextStyle(fontFamily: 'Lora', 
                      color: AppColors.primaryContainer, fontSize: 16,
                      fontWeight: FontWeight.w700),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.notifications_none_rounded,
                      color: AppColors.textPrimary, size: 22),
                    onPressed: () => context.push('/notifications'),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/profile'),
                    child: CircleAvatar(
                      radius:          16,
                      backgroundColor: AppColors.primaryContainer,
                      backgroundImage: user?.avatar != null
                          ? NetworkImage(user!.avatar!) : null,
                      child: user?.avatar == null
                          ? Text(user?.initials ?? '?',
                              style: const TextStyle(
                                color: AppColors.white, fontSize: 11,
                                fontWeight: FontWeight.w700))
                          : null,
                    ),
                  ),
                  const SizedBox(width: 4),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Heading ───────────────────────────────────────────────
                  Text(
                    'Explore Collections',
                    style: AppTextStyles.h1.copyWith(
                      fontSize: 26, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 14),

                  // ── Search bar ────────────────────────────────────────────
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color:        AppColors.white,
                      borderRadius: BorderRadius.circular(12),
                      border:       Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color:     Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8,
                          offset:    const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: TextField(
                      controller:      _searchCtrl,
                      textInputAction: TextInputAction.search,
                      onChanged:       _onChanged,
                      onSubmitted:     (_) => _submitSearch(),
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        hintText:  'Search titles, authors, or ISBN...',
                        hintStyle: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textHint, fontSize: 13),
                        border:        InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 14),
                        prefixIcon: const Icon(
                          Icons.search_rounded,
                          color: AppColors.textHint, size: 20),
                        suffixIcon: _hasSearched
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded,
                                color: AppColors.textHint, size: 18),
                              onPressed: () {
                                _searchCtrl.clear();
                                context.read<BookProvider>().clearSearch();
                                setState(() => _hasSearched = false);
                              },
                            )
                          : null,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // ── Filter chips ──────────────────────────────────────────
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _DropdownChip(
                          label:    _activeCategory ?? 'Category',
                          onTap:    () => _showPicker(
                            context, 'Category', _categories,
                            (v) => setState(() =>
                              _activeCategory = v == 'All' ? null : v),
                          ),
                        ),
                        const SizedBox(width: 8),
                        _DropdownChip(
                          label:    _activeLanguage ?? 'Language',
                          onTap:    () => _showPicker(
                            context, 'Language', _languages,
                            (v) => setState(() =>
                              _activeLanguage = v == 'All' ? null : v),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Active filter tags ────────────────────────────────────
                  if (_activeCategory != null || _activeLanguage != null) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8, runSpacing: 4,
                      children: [
                        if (_activeCategory != null)
                          _ActiveTag(
                            label: _activeCategory!,
                            onRemove: () => _clearFilter('category'),
                          ),
                        if (_activeLanguage != null)
                          _ActiveTag(
                            label: _activeLanguage!,
                            onRemove: () => _clearFilter('language'),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                ],
              ),
            ),

            // ── Results area ───────────────────────────────────────────────
            Expanded(
              child: bp.searchLoading
                ? _ShimmerGrid()
                : !_hasSearched
                  ? _emptyState()
                  : bp.error != null &&
                      bp.searchResults.isEmpty &&
                      bp.externalResults.isEmpty
                    ? AppErrorState(
                        message: bp.error,
                        onRetry: _submitSearch,
                      )
                    : (bp.searchResults.isEmpty && bp.externalResults.isEmpty)
                      ? _noResults()
                      : _ResultsGrid(
                          internal: bp.searchResults,
                          external: bp.externalResults,
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showPicker(
    BuildContext context,
    String title,
    List<String> options,
    void Function(String) onSelect,
  ) async {
    await showModalBottomSheet(
      context:       context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _PickerSheet(
        title:   title,
        options: options,
        onSelect: onSelect,
      ),
    );
  }

  Widget _emptyState() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.search_rounded, size: 60,
        color: AppColors.grey300),
      const SizedBox(height: 12),
      Text('Search for books, authors or topics',
        style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey500)),
      const SizedBox(height: 4),
      Text('Powered by IUEA Catalogue',
        style: AppTextStyles.label.copyWith(color: AppColors.textHint)),
    ]),
  );

  Widget _noResults() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.search_off_rounded, size: 60, color: AppColors.grey300),
      const SizedBox(height: 12),
      Text('No results for "${_searchCtrl.text}"',
        style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey500)),
      const SizedBox(height: 4),
      Text('Try different keywords',
        style: AppTextStyles.label.copyWith(color: AppColors.textHint)),
    ]),
  );
}


class _DropdownChip extends StatelessWidget {
  final String   label;
  final VoidCallback onTap;
  const _DropdownChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color:        AppColors.white,
          border:       Border.all(color: AppColors.border),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(label, style: AppTextStyles.label.copyWith(
            color: AppColors.textSecondary)),
          const SizedBox(width: 4),
          const Icon(Icons.keyboard_arrow_down_rounded,
            size: 14, color: AppColors.textSecondary),
        ]),
      ),
    );
  }
}

class _ActiveTag extends StatelessWidget {
  final String   label;
  final VoidCallback onRemove;
  const _ActiveTag({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color:        AppColors.primary.withValues(alpha: 0.08),
        border:       Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: AppTextStyles.label.copyWith(
          color: AppColors.primary, fontWeight: FontWeight.w500)),
        const SizedBox(width: 4),
        GestureDetector(
          onTap: onRemove,
          child: const Icon(Icons.close_rounded,
            size: 12, color: AppColors.primary),
        ),
      ]),
    );
  }
}

// ── Picker sheet ──────────────────────────────────────────────────────────────
class _PickerSheet extends StatelessWidget {
  final String       title;
  final List<String> options;
  final void Function(String) onSelect;
  const _PickerSheet({
    required this.title,
    required this.options,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(height: 8),
        Container(
          width: 40, height: 4,
          decoration: BoxDecoration(
            color: AppColors.grey300,
            borderRadius: BorderRadius.circular(2)),
        ),
        const SizedBox(height: 16),
        Text(title, style: AppTextStyles.h3.copyWith(fontSize: 16)),
        const SizedBox(height: 8),
        ...options.map((o) => ListTile(
          title: Text(o, style: AppTextStyles.body.copyWith(fontSize: 14)),
          onTap: () { Navigator.pop(context); onSelect(o); },
        )),
        const SizedBox(height: 8),
      ]),
    );
  }
}

// ── Results grid ──────────────────────────────────────────────────────────────
class _ResultsGrid extends StatelessWidget {
  final List internal;
  final List external;
  const _ResultsGrid({required this.internal, required this.external});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(slivers: [
      if (internal.isNotEmpty) ...[
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 6),
          sliver: SliverToBoxAdapter(
            child: Text(
              '${internal.length} result${internal.length != 1 ? 's' : ''} from IUEA catalogue',
              style: AppTextStyles.label),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverGrid(
            delegate: SliverChildBuilderDelegate(
              (_, i) => BookCard(book: internal[i], width: double.infinity),
              childCount: internal.length,
            ),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:   2,
              crossAxisSpacing: 10,
              mainAxisSpacing:  10,
              childAspectRatio: 0.62,
            ),
          ),
        ),
      ],

      if (external.isNotEmpty) ...[
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          sliver: SliverToBoxAdapter(
            child: Row(children: [
              const Expanded(child: Divider(color: AppColors.border)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Text('Internet Archive & Project Gutenberg',
                  style: AppTextStyles.label.copyWith(color: AppColors.textHint)),
              ),
              const Expanded(child: Divider(color: AppColors.border)),
            ]),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          sliver: SliverGrid(
            delegate: SliverChildBuilderDelegate(
              (_, i) => BookCard(book: external[i], width: double.infinity),
              childCount: external.length,
            ),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:   2,
              crossAxisSpacing: 10,
              mainAxisSpacing:  10,
              childAspectRatio: 0.62,
            ),
          ),
        ),
      ],

      const SliverToBoxAdapter(child: SizedBox(height: 32)),
    ]);
  }
}

// ── Shimmer grid ──────────────────────────────────────────────────────────────
class _ShimmerGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor:      AppColors.grey300,
      highlightColor: AppColors.grey100,
      child: GridView.builder(
        padding: const EdgeInsets.all(20),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, crossAxisSpacing: 10,
          mainAxisSpacing: 10, childAspectRatio: 0.62,
        ),
        itemCount: 8,
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
