import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../widgets/app_error_state.dart';
import '../widgets/book_card.dart';
import '../widgets/shimmer_card.dart';

const _faculties = [
  'Law', 'Medicine', 'Engineering', 'Business',
  'IT', 'Education', 'Arts', 'Science',
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  int _activeFaculty = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _reload());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _reload();
  }

  Future<void> _reload() {
    final bp = context.read<BookProvider>();
    return Future.wait([
      bp.loadFeatured(),
      bp.loadContinueReading(),
      bp.loadNewest(),
      bp.loadPopular(),
    ]);
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final bp   = context.watch<BookProvider>();
    final user = context.watch<AuthProvider>().user;
    final name = user?.name.split(' ').first ?? 'Scholar';

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Sticky Top App Bar ────────────────────────────────────────────
          SliverAppBar(
            pinned:           true,
            floating:         false,
            elevation:        0,
            backgroundColor:  AppColors.surfaceContainerLow,
            titleSpacing:     AppSpacing.pagePadding,
            toolbarHeight:    64,
            title: Row(
              children: [
                // IUEA logo
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: Image.asset(
                    'assets/images/iuea_logo.png',
                    width: 32, height: 32,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.primaryContainer,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(
                        Icons.school_rounded,
                        color: AppColors.onPrimary,
                        size: 18,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'IUEA Library',
                  style: TextStyle(fontFamily: 'Newsreader', 
                    color:      AppColors.primaryContainer,
                    fontSize:   17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search_rounded, size: 22),
                color: AppColors.primary,
                onPressed: () => context.go('/search'),
              ),
              Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined, size: 22),
                    color: AppColors.primary,
                    onPressed: () => context.push('/notifications'),
                  ),
                  Positioned(
                    top: 10, right: 10,
                    child: Container(
                      width: 7, height: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => context.go('/profile'),
                child: Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.md),
                  child: CircleAvatar(
                    radius:          16,
                    backgroundColor: AppColors.outlineVariant,
                    backgroundImage: user?.avatar != null
                        ? NetworkImage(user!.avatar!) : null,
                    child: user?.avatar == null
                        ? Text(
                            user?.initials ?? '?',
                            style: const TextStyle(
                              color:      AppColors.primaryContainer,
                              fontSize:   11,
                              fontWeight: FontWeight.w700,
                            ),
                          )
                        : null,
                  ),
                ),
              ),
            ],
          ),

          // ── Hero Banner ────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Container(
                height:       180,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end:   Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primaryContainer,
                    ],
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  children: [
                    // Decorative circle top-right
                    Positioned(
                      top: -20, right: -20,
                      child: Container(
                        width: 160, height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.onPrimary.withValues(alpha: 0.05),
                            width: 12,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -40, left: 80,
                      child: Container(
                        width: 120, height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.onPrimary.withValues(alpha: 0.04),
                            width: 8,
                          ),
                        ),
                      ),
                    ),
                    // Content
                    Padding(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment:  MainAxisAlignment.center,
                        children: [
                          Text(
                            '$_greeting, $name.',
                            style: TextStyle(fontFamily: 'Newsreader', 
                              color:      AppColors.onPrimary,
                              fontSize:   26,
                              fontWeight: FontWeight.w700,
                              height:     1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'What will you read today?',
                            style: TextStyle(
                              color:      AppColors.primaryFixed.withValues(alpha: 0.9),
                              fontSize:   15,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // ── Faculty Pills ──────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 16, bottom: 4),
              child: SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection:  Axis.horizontal,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.pagePadding),
                  itemCount:        _faculties.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) {
                    final active = i == _activeFaculty;
                    final f = _faculties[i];
                    return GestureDetector(
                      onTap: () {
                        setState(() => _activeFaculty = i);
                        context.push('/faculty/$f');
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 18, vertical: 8),
                        decoration: BoxDecoration(
                          color: active
                              ? AppColors.tertiaryContainer
                              : AppColors.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          boxShadow: active ? [
                            BoxShadow(
                              color: AppColors.tertiaryContainer.withValues(alpha: 0.3),
                              blurRadius: 8, offset: const Offset(0, 2),
                            ),
                          ] : null,
                        ),
                        child: Text(
                          f,
                          style: TextStyle(
                            fontSize:   13,
                            fontWeight: FontWeight.w600,
                            color: active
                                ? AppColors.onTertiaryContainer
                                : AppColors.onSecondaryContainer,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // ── Error state (all sections failed) ─────────────────────────────
          if (!bp.isLoading &&
              bp.error != null &&
              bp.featured.isEmpty &&
              bp.newestBooks.isEmpty &&
              bp.popularBooks.isEmpty)
            SliverFillRemaining(
              child: AppErrorState(
                message: bp.error,
                onRetry: _reload,
              ),
            ),

          // ── Continue Reading ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _SectionHeader(
              title:       'Continue Reading',
              actionLabel: 'See all',
              onAction:    () => context.go('/library'),
            ),
          ),
          SliverToBoxAdapter(
            child: bp.isLoading && bp.continueReading.isEmpty
                ? const ShimmerCardRow()
                : bp.continueReading.isEmpty
                    ? const SizedBox.shrink()
                    : _HScrollRow(
                        books:        bp.continueReading,
                        showProgress: true,
                        getProgress: (b) =>
                            ((b.progress?['percentComplete'] as num?)
                                ?.toDouble() ?? 0) / 100,
                      ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),

          // ── New in the Library ──────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: AppColors.surfaceContainerLow,
              child: _SectionHeader(
                title:       'New in the Library',
                actionLabel: 'Explore',
                onAction:    () => context.go('/search?sort=newest'),
                topPad: 20,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              color: AppColors.surfaceContainerLow,
              child: bp.isLoading && bp.newestBooks.isEmpty
                  ? const ShimmerCardRow()
                  : _HScrollRow(
                      books: bp.newestBooks,
                      cardWidth: 280,
                      showFeatureStyle: true,
                    ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // ── Popular This Week ───────────────────────────────────────────────
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
          SliverToBoxAdapter(
            child: _SectionHeader(
              title: 'Popular This Week',
            ),
          ),
          SliverToBoxAdapter(
            child: bp.isLoading && bp.popularBooks.isEmpty
                ? const ShimmerCardRow()
                : _HScrollRow(books: bp.popularBooks),
          ),

          // ── Footer ─────────────────────────────────────────────────────────
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: _Footer(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section Header ────────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final double topPad;

  const _SectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
    this.topPad = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, topPad == 0 ? 0 : topPad, 12, 12),
      child: Row(
        children: [
          Text(
            title,
            style: TextStyle(fontFamily: 'Newsreader', 
              fontSize:   20,
              fontWeight: FontWeight.w700,
              color:      AppColors.primaryContainer,
            ),
          ),
          const Spacer(),
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: const TextStyle(
                  fontSize:    13,
                  fontWeight:  FontWeight.w600,
                  color:       AppColors.secondary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Horizontal Scroll Row ─────────────────────────────────────────────────────
class _HScrollRow extends StatelessWidget {
  final List            books;
  final bool            showProgress;
  final double Function(dynamic)? getProgress;
  final double          cardWidth;
  final bool            showFeatureStyle;

  const _HScrollRow({
    required this.books,
    this.showProgress    = false,
    this.getProgress,
    this.cardWidth       = 140,
    this.showFeatureStyle = false,
  });

  @override
  Widget build(BuildContext context) {
    if (books.isEmpty) return const SizedBox.shrink();

    if (showFeatureStyle) {
      return SizedBox(
        height: 128,
        child: ListView.separated(
          scrollDirection:  Axis.horizontal,
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pagePadding),
          itemCount:        books.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) => _FeatureCard(book: books[i]),
        ),
      );
    }

    return SizedBox(
      height: cardWidth == 140 ? 280 : 320,
      child: ListView.separated(
        scrollDirection:  Axis.horizontal,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.pagePadding),
        itemCount:        books.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => BookCard(
          book:         books[i],
          width:        cardWidth,
          showProgress: showProgress,
          progress:     getProgress?.call(books[i]) ?? 0,
        ),
      ),
    );
  }
}

// ── Feature Card (for "New in Library" wide style) ────────────────────────────
class _FeatureCard extends StatelessWidget {
  final dynamic book;
  const _FeatureCard({required this.book});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/books/${book.id}'),
      child: Container(
        width:  280,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color:        AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.md),
              child: SizedBox(
                width: 56,
                child: AspectRatio(
                  aspectRatio: 2 / 3,
                  child: book.hasCover
                      ? Image.network(book.coverUrl!, fit: BoxFit.cover)
                      : Container(
                          color: AppColors.surfaceContainerHigh,
                          child: const Icon(Icons.book_outlined,
                              color: AppColors.primaryContainer, size: 20),
                        ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment:  MainAxisAlignment.center,
                children: [
                  if (book.tags.isNotEmpty)
                    Text(
                      book.tags.first.toUpperCase(),
                      style: const TextStyle(
                        fontSize:      10,
                        fontWeight:    FontWeight.w700,
                        color:         AppColors.tertiary,
                        letterSpacing: 1.0,
                      ),
                    ),
                  const SizedBox(height: 4),
                  Text(
                    book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize:    14,
                      fontWeight:  FontWeight.w700,
                      color:       AppColors.onSurface,
                      height:      1.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize:   12,
                      color:      AppColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: const [
                      Icon(Icons.star_rounded,
                          color: AppColors.tertiaryContainer, size: 14),
                      SizedBox(width: 4),
                      Text(
                        'New Arrival',
                        style: TextStyle(
                          fontSize:    10,
                          fontWeight:  FontWeight.w700,
                          color:       AppColors.onSurface,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────
class _Footer extends StatelessWidget {
  const _Footer();

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text(
        'POWERED BY GOOGLE',
        style: TextStyle(
          fontSize:       9,
          letterSpacing:  1.4,
          color:          AppColors.outline.withValues(alpha: 0.5),
        ),
      ),
      const SizedBox(height: 6),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _link('Privacy'),
        _dot(),
        _link('Terms'),
        _dot(),
        _link('Books API'),
      ]),
    ]);
  }

  Widget _link(String t) => Text(t, style: TextStyle(
    fontSize:    10,
    color:       AppColors.outline.withValues(alpha: 0.5),
    decoration:  TextDecoration.underline,
    decorationColor: AppColors.outline.withValues(alpha: 0.3),
  ));

  Widget _dot() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6),
    child: Text('·',
      style: TextStyle(fontSize: 10, color: AppColors.outline.withValues(alpha: 0.4))),
  );
}
