import 'dart:ui';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../providers/book_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../widgets/app_error_state.dart';
import '../widgets/book_card.dart';
import '../widgets/shimmer_card.dart';

// ── Brand tokens local to this file ──────────────────────────────────────────
const _kM900 = Color(0xFF3D0810);
const _kM800 = Color(0xFF5C0F1F);
const _kM700 = Color(0xFF8A1228);
const _kM600 = Color(0xFFA6182F);
const _kGold = Color(0xFFB8964A);
const _kGoldL = Color(0xFFD9B96B);
const _kInk   = Color(0xFF1C0A0C);
const _kMuted = Color(0xFF6B5456);
const _kLine  = Color(0xFFEBD2CF);

const _faculties = [
  'All', 'Law', 'Medicine', 'Engineering',
  'Business', 'IT', 'Education', 'Arts', 'Science',
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

  IconData get _greetingIcon {
    final h = DateTime.now().hour;
    if (h < 12) return AppIcons.lightMode;
    if (h < 17) return AppIcons.lightMode;
    return AppIcons.darkMode;
  }

  @override
  Widget build(BuildContext context) {
    final bp   = context.watch<BookProvider>();
    final user = context.watch<AuthProvider>().user;
    final name = user?.name.split(' ').first ?? 'Scholar';

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ── App Bar ────────────────────────────────────────────────────────
          SliverAppBar(
            pinned:          true,
            floating:        false,
            elevation:       0,
            backgroundColor: Colors.transparent,
            flexibleSpace: ClipRect(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                child: Container(
                  decoration: BoxDecoration(
                    color:  _kM900.withValues(alpha: 0.93),
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.white.withValues(alpha: 0.08),
                        width: 0.5,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            titleSpacing:  AppSpacing.pagePadding,
            toolbarHeight: 60,
            title: Row(children: [
              // Logo
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: Image.asset(
                  'assets/images/iuea_logo.png',
                  width: 28, height: 28, fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => Container(
                    width: 28, height: 28,
                    decoration: BoxDecoration(
                      color: _kM700,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(AppIcons.school,
                        color: Colors.white, size: 16),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ShaderMask(
                shaderCallback: (b) => const LinearGradient(
                  colors: [_kGoldL, _kGold],
                ).createShader(b),
                child: const Text(
                  'IUEA Library',
                  style: TextStyle(
                    fontFamily:  'Newsreader',
                    fontSize:    17,
                    fontWeight:  FontWeight.w700,
                    color:       Colors.white,
                  ),
                ),
              ),
            ]),
            actions: [
              IconButton(
                icon: const Icon(AppIcons.search, size: 21),
                color: Colors.white.withValues(alpha: 0.85),
                onPressed: () => context.go('/search'),
              ),
              Stack(alignment: Alignment.center, children: [
                IconButton(
                  icon: const Icon(AppIcons.notification, size: 21),
                  color: Colors.white.withValues(alpha: 0.85),
                  onPressed: () => context.push('/notifications'),
                ),
                Positioned(
                  top: 10, right: 10,
                  child: Container(
                    width: 6, height: 6,
                    decoration: const BoxDecoration(
                      color: _kGold, shape: BoxShape.circle),
                  ),
                ),
              ]),
              GestureDetector(
                onTap: () => context.go('/profile'),
                child: Padding(
                  padding: const EdgeInsets.only(right: 14),
                  child: CircleAvatar(
                    radius:          16,
                    backgroundColor: _kM700,
                    backgroundImage: user?.avatar != null
                        ? NetworkImage(user!.avatar!) : null,
                    child: user?.avatar == null
                        ? Text(
                            user?.initials ?? '?',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
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
            child: _HeroBanner(
              greeting:     _greeting,
              greetingIcon: _greetingIcon,
              name:         name,
              inProgress:   bp.continueReading.length,
              totalBooks:   bp.popularBooks.length + bp.newestBooks.length,
              onSearch:     () => context.go('/search'),
              onLibrary:    () => context.go('/library'),
            ),
          ),

          // ── Metric Cards ───────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(children: [
                _MetricCard(
                  icon:    AppIcons.fire,
                  iconBg:  const Color(0xFFFF6B35),
                  value:   '${bp.continueReading.length}',
                  label:   'In Progress',
                ),
                const SizedBox(width: 10),
                _MetricCard(
                  icon:    AppIcons.podcasts,
                  iconBg:  _kM700,
                  value:   'Live',
                  label:   'Podcasts',
                  onTap:   () => context.go('/podcasts'),
                  showArrow: true,
                ),
                const SizedBox(width: 10),
                _MetricCard(
                  icon:    AppIcons.downloadDone,
                  iconBg:  AppColors.success,
                  value:   'Offline',
                  label:   'Downloads',
                  onTap:   () => context.push('/downloads'),
                  showArrow: true,
                ),
              ]),
            ),
          ),

          // ── Faculty Chips ──────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 18, bottom: 2),
              child: SizedBox(
                height: 36,
                child: ListView.separated(
                  scrollDirection:  Axis.horizontal,
                  physics:          const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.pagePadding),
                  itemCount:        _faculties.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final active = i == _activeFaculty;
                    final f = _faculties[i];
                    return GestureDetector(
                      onTap: () {
                        setState(() => _activeFaculty = i);
                        if (f != 'All') context.push('/faculty/$f');
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 7),
                        decoration: BoxDecoration(
                          color: active ? _kGold : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          border: Border.all(
                            color: active
                                ? _kGold
                                : _kGold.withValues(alpha: 0.35),
                            width: 1.2,
                          ),
                          boxShadow: active ? [
                            BoxShadow(
                              color:     _kGold.withValues(alpha: 0.3),
                              blurRadius: 8,
                              offset:    const Offset(0, 3),
                            ),
                          ] : null,
                        ),
                        child: Text(
                          f,
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize:   12,
                            fontWeight: FontWeight.w600,
                            color: active ? _kM900 : _kMuted,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // ── Error State ────────────────────────────────────────────────────
          if (!bp.isLoading &&
              bp.error != null &&
              bp.featured.isEmpty &&
              bp.newestBooks.isEmpty &&
              bp.popularBooks.isEmpty)
            SliverFillRemaining(
              child: AppErrorState(message: bp.error, onRetry: _reload),
            ),

          // ── Continue Reading ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: _SectionHeader(
              title:       'Continue Reading',
              actionLabel: 'Library',
              onAction:    () => context.go('/library'),
            ),
          ),
          SliverToBoxAdapter(
            child: bp.isLoading && bp.continueReading.isEmpty
                ? const _ContinueReadingShimmer()
                : bp.continueReading.isEmpty
                    ? const SizedBox.shrink()
                    : _ContinueReadingRow(books: bp.continueReading),
          ),

          // ── New Arrivals ────────────────────────────────────────────────────
          SliverToBoxAdapter(child: Container(
            margin: const EdgeInsets.only(top: 24),
            color:  AppColors.surfaceContainerLow,
            child:  _SectionHeader(
              title:       'New Arrivals',
              actionLabel: 'Explore',
              onAction:    () => context.go('/search?sort=newest'),
              topPad:      20,
            ),
          )),
          SliverToBoxAdapter(child: Container(
            color: AppColors.surfaceContainerLow,
            child: bp.isLoading && bp.newestBooks.isEmpty
                ? const ShimmerCardRow()
                : _NewArrivalsRow(books: bp.newestBooks),
          )),
          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // ── Popular This Week ───────────────────────────────────────────────
          const SliverToBoxAdapter(child: SizedBox(height: 20)),
          SliverToBoxAdapter(
            child: _SectionHeader(title: 'Popular This Week'),
          ),
          SliverToBoxAdapter(
            child: bp.isLoading && bp.popularBooks.isEmpty
                ? const ShimmerCardRow()
                : SizedBox(
                    height: 300,
                    child: ListView.separated(
                      scrollDirection:  Axis.horizontal,
                      physics:          const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.pagePadding),
                      itemCount:        bp.popularBooks.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 12),
                      itemBuilder: (_, i) =>
                          BookCard(book: bp.popularBooks[i], width: 140),
                    ),
                  ),
          ),

          // ── Footer ─────────────────────────────────────────────────────────
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child:   _Footer(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner
// ─────────────────────────────────────────────────────────────────────────────
class _HeroBanner extends StatelessWidget {
  final String     greeting;
  final IconData   greetingIcon;
  final String     name;
  final int        inProgress;
  final int        totalBooks;
  final VoidCallback onSearch;
  final VoidCallback onLibrary;

  const _HeroBanner({
    required this.greeting,
    required this.greetingIcon,
    required this.name,
    required this.inProgress,
    required this.totalBooks,
    required this.onSearch,
    required this.onLibrary,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end:   Alignment.bottomRight,
            colors: [_kM900, _kM800, _kM700, _kM600],
            stops: [0.0, 0.3, 0.65, 1.0],
          ),
          boxShadow: [
            BoxShadow(
              color:      _kM700.withValues(alpha: 0.45),
              blurRadius: 28,
              offset:     const Offset(0, 10),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(children: [
          // Decorative ring — top right
          Positioned(
            top: -40, right: -40,
            child: Container(
              width: 200, height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.05), width: 20),
              ),
            ),
          ),
          // Decorative ring — bottom left
          Positioned(
            bottom: -55, left: 40,
            child: Container(
              width: 160, height: 160,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.04), width: 12),
              ),
            ),
          ),
          // Gold open-book watermark
          Positioned(
            right: 20, bottom: 16,
            child: Icon(
              AppIcons.bookpen,
              size:  80,
              color: _kGold.withValues(alpha: 0.12),
            ),
          ),
          // Small gold dot cluster (decorative)
          Positioned(
            right: 90, top: 22,
            child: Row(
              children: List.generate(3, (i) => Container(
                margin: const EdgeInsets.only(right: 4),
                width:  i == 1 ? 5 : 3,
                height: i == 1 ? 5 : 3,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _kGold.withValues(alpha: i == 1 ? 0.55 : 0.3),
                ),
              )),
            ),
          ),
          // Main content
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 22, 24, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Greeting badge
                _GoldBadge(icon: greetingIcon, label: greeting.toUpperCase()),
                const SizedBox(height: 12),
                // Name
                Text(
                  '$name.',
                  style: const TextStyle(
                    fontFamily: 'Newsreader',
                    color:      Colors.white,
                    fontSize:   34,
                    fontWeight: FontWeight.w700,
                    height:     1.05,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'What will you explore today?',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    color:      Colors.white.withValues(alpha: 0.65),
                    fontSize:   13,
                  ),
                ),
                const SizedBox(height: 16),
                // Embedded stat chips row
                Row(children: [
                  _HeroChip(
                    icon:  AppIcons.fire,
                    label: '$inProgress reading',
                    color: const Color(0xFFFF8C42),
                    onTap: onLibrary,
                  ),
                  const SizedBox(width: 8),
                  _HeroChip(
                    icon:  AppIcons.bookpen,
                    label: '$totalBooks books',
                    color: _kGoldL,
                    onTap: onLibrary,
                  ),
                  const SizedBox(width: 8),
                  _HeroChip(
                    icon:  AppIcons.heartOutline,
                    label: 'Saved',
                    color: Colors.white.withValues(alpha: 0.7),
                    onTap: () {},
                  ),
                ]),
                const SizedBox(height: 18),
                // Search bar
                GestureDetector(
                  onTap: onSearch,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 11),
                    decoration: BoxDecoration(
                      color:        Colors.white.withValues(alpha: 0.13),
                      borderRadius: BorderRadius.circular(14),
                      border:       Border.all(
                          color: Colors.white.withValues(alpha: 0.22)),
                    ),
                    child: Row(children: [
                      Icon(AppIcons.search,
                          size: 16,
                          color: Colors.white.withValues(alpha: 0.75)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Search books, authors, topics…',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            color:      Colors.white.withValues(alpha: 0.6),
                            fontSize:   13,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color:        _kGold.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(6),
                          border:       Border.all(
                              color: _kGold.withValues(alpha: 0.4)),
                        ),
                        child: const Text(
                          '⌘ K',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            color:      _kGoldL,
                            fontSize:   10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ]),
                  ),
                ),
              ],
            ),
          ),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero sub-widgets
// ─────────────────────────────────────────────────────────────────────────────
class _GoldBadge extends StatelessWidget {
  final IconData icon;
  final String   label;
  const _GoldBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color:        _kGold.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(AppRadius.full),
        border:       Border.all(color: _kGold.withValues(alpha: 0.4)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 11, color: _kGoldL),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(
            fontFamily:    'Inter',
            color:         _kGoldL,
            fontSize:      9,
            fontWeight:    FontWeight.w700,
            letterSpacing: 1.3,
          ),
        ),
      ]),
    );
  }
}

class _HeroChip extends StatelessWidget {
  final IconData     icon;
  final String       label;
  final Color        color;
  final VoidCallback onTap;
  const _HeroChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
        decoration: BoxDecoration(
          color:        Colors.white.withValues(alpha: 0.09),
          borderRadius: BorderRadius.circular(20),
          border:       Border.all(
              color: Colors.white.withValues(alpha: 0.14)),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize:   11,
              fontWeight: FontWeight.w600,
              color:      Colors.white.withValues(alpha: 0.85),
            ),
          ),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Cards Row
// ─────────────────────────────────────────────────────────────────────────────
class _MetricCard extends StatelessWidget {
  final IconData     icon;
  final Color        iconBg;
  final String       value;
  final String       label;
  final VoidCallback? onTap;
  final bool         showArrow;

  const _MetricCard({
    required this.icon,
    required this.iconBg,
    required this.value,
    required this.label,
    this.onTap,
    this.showArrow = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color:        Colors.white,
            borderRadius: BorderRadius.circular(16),
            border:       Border.all(color: _kLine, width: 0.5),
            boxShadow: [
              BoxShadow(
                color:      Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset:     const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15.5),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(width: 3, color: iconBg),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 10, 12),
                      child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 30, height: 30,
                    decoration: BoxDecoration(
                      color:        iconBg.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(9),
                    ),
                    child: Icon(icon, size: 15, color: iconBg),
                  ),
                  if (showArrow)
                    Icon(AppIcons.chevronRight,
                        size: 11,
                        color: _kMuted.withValues(alpha: 0.5)),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: TextStyle(
                  fontFamily: 'Inter',
                  fontSize:   16,
                  fontWeight: FontWeight.w800,
                  color:      _kInk,
                  height:     1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Inter',
                  fontSize:   10,
                  color:      _kMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Header with gold rule
// ─────────────────────────────────────────────────────────────────────────────
class _SectionHeader extends StatelessWidget {
  final String       title;
  final String?      actionLabel;
  final VoidCallback? onAction;
  final double       topPad;

  const _SectionHeader({
    required this.title,
    this.actionLabel,
    this.onAction,
    this.topPad = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, topPad == 0 ? 20 : topPad, 16, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            title,
            style: TextStyle(
              fontFamily: 'Newsreader',
              fontSize:   19,
              fontWeight: FontWeight.w700,
              color:      AppColors.primaryContainer,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Container(
              height: 1,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _kGold.withValues(alpha: 0.35),
                    _kGold.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onAction,
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(
                  actionLabel!,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize:   12,
                    fontWeight: FontWeight.w600,
                    color:      _kGold,
                  ),
                ),
                const SizedBox(width: 2),
                const Icon(AppIcons.chevronRight,
                    size: 10, color: _kGold),
              ]),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Continue Reading — landscape cards (Audiobook Card pattern)
// ─────────────────────────────────────────────────────────────────────────────
class _ContinueReadingRow extends StatelessWidget {
  final List books;
  const _ContinueReadingRow({required this.books});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width - 32;
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection:  Axis.horizontal,
        physics:          const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount:        books.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => _ContinueCard(book: books[i], width: w),
      ),
    );
  }
}

class _ContinueCard extends StatelessWidget {
  final dynamic book;
  final double  width;
  const _ContinueCard({required this.book, required this.width});

  @override
  Widget build(BuildContext context) {
    final pct = ((book.progress?['percentComplete'] as num?)?.toDouble() ?? 0);
    final progress = (pct / 100).clamp(0.0, 1.0);
    final pctLabel = '${pct.toInt()}%';

    return GestureDetector(
      onTap: () => context.push('/reader/${book.id}'),
      child: Container(
        width:   width,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color:        Colors.white,
          borderRadius: BorderRadius.circular(18),
          border:       Border.all(color: _kLine),
          boxShadow: [
            BoxShadow(
              color:      Colors.black.withValues(alpha: 0.05),
              blurRadius: 12,
              offset:     const Offset(0, 4),
            ),
          ],
        ),
        child: Row(children: [
          // Cover
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 56,
              child: AspectRatio(
                aspectRatio: 2 / 3,
                child: book.hasCover
                    ? Image.network(book.coverUrl!, fit: BoxFit.cover)
                    : Container(
                        color: _kM700.withValues(alpha: 0.1),
                        child: const Icon(AppIcons.book,
                            color: _kM700, size: 22),
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
                if (book.tags?.isNotEmpty == true)
                  Text(
                    (book.tags as List).first.toString().toUpperCase(),
                    style: const TextStyle(
                      fontFamily:    'Inter',
                      fontSize:      9,
                      fontWeight:    FontWeight.w700,
                      color:         _kGold,
                      letterSpacing: 0.8,
                    ),
                  ),
                const SizedBox(height: 2),
                Text(
                  book.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Newsreader',
                    fontSize:   13,
                    fontWeight: FontWeight.w700,
                    color:      _kInk,
                    height:     1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  book.author,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize:   11,
                    color:      _kMuted,
                  ),
                ),
                const SizedBox(height: 8),
                // Progress bar (segmented look)
                Row(children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value:           progress,
                        minHeight:       4,
                        backgroundColor: _kLine,
                        valueColor:      const AlwaysStoppedAnimation(_kGold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    pctLabel,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize:   10,
                      fontWeight: FontWeight.w700,
                      color:      _kGold,
                    ),
                  ),
                ]),
              ],
            ),
          ),
          const SizedBox(width: 8),
          // Continue arrow
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              color:  _kM700.withValues(alpha: 0.08),
              shape:  BoxShape.circle,
              border: Border.all(
                color: _kM700.withValues(alpha: 0.15)),
            ),
            child: const Icon(AppIcons.play,
                size: 16, color: _kM700),
          ),
        ]),
      ),
    );
  }
}

class _ContinueReadingShimmer extends StatelessWidget {
  const _ContinueReadingShimmer();

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.sizeOf(context).width - 32;
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection:  Axis.horizontal,
        physics:          const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount:        2,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, __) => Shimmer.fromColors(
          baseColor:      AppColors.grey300,
          highlightColor: const Color(0xFFF5F5F5),
          child: Container(
            width: w,
            decoration: BoxDecoration(
              color:        Colors.white,
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// New Arrivals — tall full-cover cards with gradient overlay
// ─────────────────────────────────────────────────────────────────────────────
class _NewArrivalsRow extends StatelessWidget {
  final List books;
  const _NewArrivalsRow({required this.books});

  @override
  Widget build(BuildContext context) {
    if (books.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 230,
      child: ListView.separated(
        scrollDirection:  Axis.horizontal,
        physics:          const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pagePadding, vertical: 4),
        itemCount:        books.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => _NewArrivalCard(book: books[i]),
      ),
    );
  }
}

class _NewArrivalCard extends StatelessWidget {
  final dynamic book;
  const _NewArrivalCard({required this.book});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/books/${book.id}'),
      child: Container(
        width:    150,
        decoration: BoxDecoration(
          color:        AppColors.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color:      Colors.black.withValues(alpha: 0.12),
              blurRadius: 14,
              offset:     const Offset(0, 5),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(children: [
          // Cover image
          Positioned.fill(
            child: book.hasCover
                ? Image.network(book.coverUrl!, fit: BoxFit.cover)
                : Container(
                    color: _kM900,
                    child: Center(
                      child: Icon(AppIcons.bookpen,
                          color: _kGold.withValues(alpha: 0.4), size: 40),
                    ),
                  ),
          ),
          // Bottom gradient overlay
          Positioned(
            left: 0, right: 0, bottom: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(10, 30, 10, 10),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end:   Alignment.topCenter,
                  colors: [Color(0xE6000000), Color(0x66000000), Colors.transparent],
                  stops: [0.0, 0.6, 1.0],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize:       MainAxisSize.min,
                children: [
                  Text(
                    book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Newsreader',
                      fontSize:   13,
                      fontWeight: FontWeight.w700,
                      color:      Colors.white,
                      height:     1.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    book.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize:   10,
                      color:      Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // NEW badge — top right
          Positioned(
            top: 8, right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
              decoration: BoxDecoration(
                color:        _kGold,
                borderRadius: BorderRadius.circular(6),
                boxShadow: [
                  BoxShadow(
                    color:      _kGold.withValues(alpha: 0.5),
                    blurRadius: 8,
                    offset:     const Offset(0, 2),
                  ),
                ],
              ),
              child: const Text(
                'NEW',
                style: TextStyle(
                  fontFamily:    'Inter',
                  fontSize:      8,
                  fontWeight:    FontWeight.w800,
                  color:         _kM900,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────────────────────
class _Footer extends StatelessWidget {
  const _Footer();

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(width: 20, height: 1,
              color: _kLine.withValues(alpha: 0.6)),
          const SizedBox(width: 10),
          Text(
            'IUEA DIGITAL LIBRARY',
            style: TextStyle(
              fontFamily:    'Inter',
              fontSize:      8,
              letterSpacing: 2.0,
              fontWeight:    FontWeight.w600,
              color:         _kMuted.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(width: 10),
          Container(width: 20, height: 1,
              color: _kLine.withValues(alpha: 0.6)),
        ],
      ),
      const SizedBox(height: 8),
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
    fontFamily:  'Inter',
    fontSize:    10,
    color:       _kMuted.withValues(alpha: 0.5),
    decoration:  TextDecoration.underline,
    decorationColor: _kLine,
  ));

  Widget _dot() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6),
    child: Text('·',
      style: TextStyle(fontSize: 10,
          color: _kMuted.withValues(alpha: 0.4))),
  );
}
