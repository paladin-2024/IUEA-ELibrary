import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../data/models/book_model.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/book_card.dart';

class BookDetailScreen extends StatefulWidget {
  final String bookId;
  const BookDetailScreen({super.key, required this.bookId});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<BookModel>    _similar  = [];
  bool               _expanded = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final bp = context.read<BookProvider>();
      await bp.getBook(widget.bookId);
      try {
        final sims = await bp.getSimilarBooks(widget.bookId);
        if (mounted) setState(() => _similar = sims);
      } catch {}
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bp   = context.watch<BookProvider>();
    final book = bp.current;

    if (bp.isLoading || book == null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.primary,
          leading:         _backButton(context),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    final availability = book.availability;
    final isAvailable  = (availability?['available'] as int? ?? 0) > 0;
    final hasFile      = book.hasFile || book.archiveId != null;

    final words    = (book.description ?? '').split(' ');
    final isLong   = words.length > 60;
    final descText = isLong && !_expanded
        ? '${words.take(60).join(' ')}…'
        : (book.description ?? 'No description available.');

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Cover SliverAppBar ─────────────────────────────────────────
          SliverAppBar(
            expandedHeight:  300,
            pinned:          true,
            backgroundColor: AppColors.primary,
            leading:         _backButton(context),
            actions: [
              IconButton(
                icon:      const Icon(Icons.share_outlined, color: AppColors.white),
                onPressed: () {},
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: book.hasCover
                  ? CachedNetworkImage(
                      imageUrl:    book.coverUrl!,
                      fit:         BoxFit.cover,
                      errorWidget: (_, __, ___) => _coverPlaceholder(),
                    )
                  : _coverPlaceholder(),
            ),
          ),

          // ── Body content ───────────────────────────────────────────────
          SliverList(
            delegate: SliverChildListDelegate([
              Container(
                color:   AppColors.background,
                padding: const EdgeInsets.all(AppSpacing.pagePadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(book.title, style: AppTextStyles.h2),
                    const SizedBox(height: 6),

                    // Author
                    Row(
                      children: [
                        const Icon(Icons.person_outline,
                          size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            book.author,
                            style: AppTextStyles.body.copyWith(
                              color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sm),

                    // Availability chip
                    if (availability != null) ...[
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isAvailable
                                ? Icons.check_circle_outline
                                : Icons.warning_amber_outlined,
                            size:  14,
                            color: isAvailable
                                ? AppColors.success
                                : AppColors.warning,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isAvailable
                                ? '${availability['available']} of '
                                  '${availability['total']} available'
                                : 'Checked out',
                            style: AppTextStyles.label.copyWith(
                              color: isAvailable
                                  ? AppColors.success
                                  : AppColors.warning,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],

                    // Language chips
                    if (book.languages.isNotEmpty) ...[
                      Wrap(
                        spacing: 6, runSpacing: 4,
                        children: book.languages.map((lang) => Chip(
                          label: Text(lang,
                            style: const TextStyle(
                              color: AppColors.white, fontSize: 11)),
                          backgroundColor: AppColors.primary,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                          padding:         EdgeInsets.zero,
                          visualDensity:   VisualDensity.compact,
                        )).toList(),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],

                    // Faculty tags (gold bordered)
                    if (book.faculty.isNotEmpty) ...[
                      Wrap(
                        spacing: 6, runSpacing: 4,
                        children: book.faculty.map((f) => Chip(
                          label: Text(f,
                            style: const TextStyle(
                              color: AppColors.accent, fontSize: 11)),
                          backgroundColor: Colors.transparent,
                          side:            const BorderSide(color: AppColors.accent),
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                          padding:         EdgeInsets.zero,
                          visualDensity:   VisualDensity.compact,
                        )).toList(),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                    ],

                    // Source attribution
                    Text(
                      'Source: IUEA Koha Catalogue',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.textHint),
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    // Action buttons
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: hasFile
                            ? () => context.push('/reader/${book.id}')
                            : null,
                        icon:  const Icon(Icons.auto_stories, size: 18),
                        label: const Text('Read Now'),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: hasFile
                            ? () => context.push('/audio/${book.id}')
                            : null,
                        icon:  const Icon(Icons.play_circle_outline, size: 18),
                        label: const Text('Listen'),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon:  const Icon(Icons.bookmark_border, size: 16),
                            label: const Text('Save'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon:  const Icon(Icons.share_outlined, size: 16),
                            label: const Text('Share'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // ── Tab bar ────────────────────────────────────────────────
              ColoredBox(
                color: AppColors.background,
                child: TabBar(
                  controller:          _tabs,
                  labelColor:          AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  indicatorColor:      AppColors.primary,
                  tabs: const [Tab(text: 'About'), Tab(text: 'Similar Books')],
                ),
              ),

              // ── Tab content ────────────────────────────────────────────
              SizedBox(
                height: 400,
                child: TabBarView(
                  controller: _tabs,
                  children: [
                    // About
                    SingleChildScrollView(
                      padding: const EdgeInsets.all(AppSpacing.pagePadding),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(descText, style: AppTextStyles.body),
                          if (isLong)
                            TextButton(
                              onPressed: () =>
                                  setState(() => _expanded = !_expanded),
                              child: Text(
                                _expanded ? 'Show less' : 'Read more',
                                style: AppTextStyles.label.copyWith(
                                  color: AppColors.primary),
                              ),
                            ),
                        ],
                      ),
                    ),

                    // Similar
                    _similar.isEmpty
                        ? const Center(
                            child: Text('No similar books found.',
                              style: TextStyle(color: AppColors.textHint)),
                          )
                        : GridView.builder(
                            padding:      const EdgeInsets.all(AppSpacing.md),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount:   2,
                              crossAxisSpacing: AppSpacing.sm,
                              mainAxisSpacing:  AppSpacing.sm,
                              childAspectRatio: 0.65,
                            ),
                            itemCount:   _similar.length,
                            itemBuilder: (_, i) =>
                                BookCard(book: _similar[i]),
                          ),
                  ],
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _backButton(BuildContext context) => IconButton(
    icon:      const Icon(Icons.arrow_back, color: AppColors.white),
    onPressed: () => context.pop(),
  );

  Widget _coverPlaceholder() => Container(
    color: AppColors.primaryDark,
    child: const Center(
      child: Icon(Icons.book_outlined, size: 64, color: AppColors.white),
    ),
  );
}
