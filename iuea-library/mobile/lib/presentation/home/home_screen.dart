import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/book_card.dart';

const _faculties = [
  'Law', 'Medicine', 'Engineering', 'Business',
  'IT', 'Education', 'Arts', 'Science',
];

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final bp = context.read<BookProvider>();
      bp.loadFeatured();
      bp.loadContinueReading();
      bp.loadNewest();
      bp.loadPopular();
    });
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
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Welcome banner ───────────────────────────────────────────
              Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primaryDark, AppColors.primary],
                    begin:  Alignment.topLeft,
                    end:    Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.pagePadding,
                  AppSpacing.lg,
                  AppSpacing.pagePadding,
                  AppSpacing.md,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // App bar row
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '$_greeting, $name',
                                style: AppTextStyles.h2.copyWith(
                                  color: AppColors.white, fontSize: 20),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'What will you read today?',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.white.withOpacity(0.7)),
                              ),
                            ],
                          ),
                        ),
                        // Bell + Avatar
                        IconButton(
                          icon: const Icon(Icons.notifications_none,
                            color: AppColors.white),
                          onPressed: () {},
                        ),
                        GestureDetector(
                          onTap: () => context.go('/profile'),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundColor: AppColors.accent,
                            child: Text(
                              user?.initials ?? '?',
                              style: const TextStyle(
                                color:      AppColors.white,
                                fontSize:   13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),

                    // Faculty filter pills
                    SizedBox(
                      height: 32,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount:       _faculties.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) {
                          final f = _faculties[i];
                          return GestureDetector(
                            onTap: () => context.push('/search?faculty=$f'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppColors.white.withOpacity(0.4)),
                                borderRadius: BorderRadius.circular(
                                  AppSpacing.chipRadius),
                              ),
                              child: Text(f,
                                style: AppTextStyles.label.copyWith(
                                  color: AppColors.white.withOpacity(0.85))),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: AppSpacing.lg),

              // ── Continue Reading ─────────────────────────────────────────
              if (bp.continueReading.isNotEmpty) ...[
                _SectionHeader(title: 'Continue Reading', onSeeAll: () => context.go('/library')),
                _HScrollRow(
                  books:        bp.continueReading,
                  isLoading:    bp.isLoading,
                  showProgress: true,
                  getProgress:  (b) =>
                      ((b.availability?['progress']?['percentComplete'] as num?)?.toDouble() ?? 0) / 100,
                ),
                const SizedBox(height: AppSpacing.lg),
              ],

              // ── New in Library ───────────────────────────────────────────
              _SectionHeader(title: 'New in the Library', onSeeAll: () => context.go('/search?sort=newest')),
              _HScrollRow(books: bp.newestBooks, isLoading: bp.isLoading),
              const SizedBox(height: AppSpacing.lg),

              // ── Popular this week ────────────────────────────────────────
              _SectionHeader(title: 'Popular This Week', onSeeAll: () => context.go('/search?sort=popular')),
              _HScrollRow(books: bp.popularBooks, isLoading: bp.isLoading),

              const SizedBox(height: AppSpacing.xl),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Section header ─────────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String   title;
  final VoidCallback onSeeAll;
  const _SectionHeader({required this.title, required this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.pagePadding, 0, AppSpacing.md, AppSpacing.sm),
      child: Row(
        children: [
          Text(title,
            style: AppTextStyles.h3.copyWith(fontSize: 16)),
          const Spacer(),
          TextButton(
            onPressed: onSeeAll,
            child: Text('See all',
              style: AppTextStyles.label.copyWith(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}

// ── Horizontal scroll row ──────────────────────────────────────────────────────
class _HScrollRow extends StatelessWidget {
  final List         books;
  final bool         isLoading;
  final bool         showProgress;
  final double Function(dynamic)? getProgress;

  const _HScrollRow({
    required this.books,
    required this.isLoading,
    this.showProgress = false,
    this.getProgress,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading && books.isEmpty) {
      return SizedBox(
        height: 200,
        child: ListView.separated(
          scrollDirection:  Axis.horizontal,
          padding:          const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
          itemCount:        6,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
          itemBuilder:      (_, __) => _SkeletonCard(),
        ),
      );
    }
    if (books.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 220,
      child: ListView.separated(
        scrollDirection:  Axis.horizontal,
        padding:          const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
        itemCount:        books.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (_, i) => BookCard(
          book:         books[i],
          showProgress: showProgress,
          progress:     getProgress?.call(books[i]) ?? 0,
        ),
      ),
    );
  }
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
class _SkeletonCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height:       170,
            decoration: BoxDecoration(
              color:        AppColors.grey300,
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
            ),
          ),
          const SizedBox(height: 6),
          Container(height: 10, width: 90, color: AppColors.grey300),
          const SizedBox(height: 4),
          Container(height: 8,  width: 60, color: AppColors.grey300),
        ],
      ),
    );
  }
}
